from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, AIMessage
from langchain.schema import SystemMessage
import logging
import json
import re
from typing import Dict, List, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        # Defer heavy LLM initialization when OPENAI_API_KEY is not set
        self.llm = None
        self.document_analysis_chain = None
        self.query_chain = None
        self.chat_chain = None

        # Initialize memory before creating chat chain
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

        if getattr(settings, "OPENAI_API_KEY", None):
            try:
                # Import here to avoid hard dependency when key is absent
                from langchain_openai import ChatOpenAI  # type: ignore

                self.llm = ChatOpenAI(
                    model_name=settings.OPENAI_MODEL,
                    temperature=0.1,
                    api_key=settings.OPENAI_API_KEY,
                )

                # Initialize chains only when LLM is available
                self.document_analysis_chain = self._create_document_analysis_chain()
                self.query_chain = self._create_query_chain()
                self.chat_chain = self._create_chat_chain()
            except Exception as exc:
                logging.getLogger(__name__).warning(
                    f"LLM initialization skipped due to error: {exc}. Running with stub responses."
                )

    
    def _create_document_analysis_chain(self) -> LLMChain:
        """
        Create chain for document analysis and classification
        """
        template = """
        Analyze the following document text and extract structured information.
        
        Document Text:
        {text}
        
        Please provide a JSON response with the following structure:
        {{
            "document_type": "invoice|contract|receipt|financial_statement|other",
            "confidence": 0.95,
            "entities": {{
                "total_amount": 1234.56,
                "currency": "USD",
                "invoice_number": "INV-001",
                "vendor_name": "Company Name",
                "vendor_address": "Address",
                "date": "2024-01-01",
                "due_date": "2024-02-01",
                "line_items": [
                    {{
                        "description": "Item description",
                        "quantity": 1,
                        "unit_price": 100.00,
                        "total": 100.00
                    }}
                ]
            }},
            "summary": "Brief summary of the document"
        }}
        
        Response (JSON only):
        """
        
        prompt = PromptTemplate(
            input_variables=["text"],
            template=template
        )
        
        return LLMChain(llm=self.llm, prompt=prompt)
    
    def _create_query_chain(self) -> LLMChain:
        """
        Create chain for natural language queries
        """
        template = """
        Based on the following document context, answer the user's question.
        
        User Question: {query}
        
        Document Context:
        {context}
        
        Please provide a clear, accurate answer based on the document information.
        If the information is not available in the documents, say so.
        
        Answer:
        """
        
        prompt = PromptTemplate(
            input_variables=["query", "context"],
            template=template
        )
        
        return LLMChain(llm=self.llm, prompt=prompt)
    
    def _create_chat_chain(self) -> LLMChain:
        """
        Create chain for conversational chat
        """
        template = """
        You are an AI assistant specialized in financial document analysis.
        You help users understand and query their financial documents.
        
        Chat History:
        {chat_history}
        
        Human: {input}
        AI Assistant:
        """
        
        prompt = PromptTemplate(
            input_variables=["chat_history", "input"],
            template=template
        )
        
        return LLMChain(llm=self.llm, prompt=prompt, memory=self.memory)
    
    async def analyze_document(self, text: str, file_path: str) -> Dict[str, Any]:
        """
        Analyze a document and extract structured information
        """
        try:
            logger.info(f"Analyzing document: {file_path}")
            
            if not self.document_analysis_chain:
                # Stubbed response when LLM is unavailable
                return {
                    "document_type": "other",
                    "confidence": 0.5,
                    "entities": {},
                    "summary": "LLM not configured. Provide OPENAI_API_KEY to enable analysis.",
                }

            # Run document analysis chain
            try:
                result = await self.document_analysis_chain.arun(text=text)
            except Exception as exc:
                logger.error(f"Document analysis chain failed: {exc}")
                # Fallback to lightweight classification
                cls = await self.classify_document_type(text)
                return {
                    "document_type": cls.get("document_type", "other"),
                    "confidence": cls.get("confidence", 0.5),
                    "entities": {},
                    "summary": cls.get("reasoning", "classification fallback")
                }
            
            # Parse JSON response
            try:
                analysis = json.loads(result)
                logger.info(f"Document analysis completed: {analysis.get('document_type')}")
                return analysis
            except json.JSONDecodeError:
                logger.error(f"Failed to parse AI response as JSON: {result}")
                cls = await self.classify_document_type(text)
                return {
                    "document_type": cls.get("document_type", "other"),
                    "confidence": cls.get("confidence", 0.5),
                    "entities": {},
                    "summary": cls.get("reasoning", "classification fallback")
                }
                
        except Exception as e:
            logger.error(f"Error analyzing document: {e}")
            return {
                "document_type": "other",
                "confidence": 0.0,
                "entities": {},
                "summary": f"Analysis error: {str(e)}"
            }
    
    async def generate_query_response(self, query: str, context: List[Dict[str, Any]]) -> str:
        """
        Generate response to natural language query
        """
        try:
            logger.info(f"Processing query: {query}")
            
            # Prepare context string
            context_str = ""
            for doc in context:
                context_str += f"\nDocument: {doc['filename']}\n"
                context_str += f"Type: {doc.get('type', 'unknown')}\n"
                context_str += f"Text: {doc.get('text', '')[:1000]}...\n"
                if doc.get('extracted_data'):
                    context_str += f"Extracted Data: {json.dumps(doc['extracted_data'], indent=2)}\n"
                context_str += "-" * 50 + "\n"
            
            if not self.query_chain:
                return "LLM not configured. Provide OPENAI_API_KEY to enable query answering."

            # Run query chain
            response = await self.query_chain.arun(query=query, context=context_str)
            
            logger.info(f"Query response generated")
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating query response: {e}")
            return f"I'm sorry, I encountered an error while processing your query: {str(e)}"
    
    async def generate_chat_response(self, message: str, user_id: str) -> str:
        """
        Generate conversational chat response
        """
        try:
            logger.info(f"Generating chat response for user {user_id}")
            
            if not self.chat_chain:
                return "LLM not configured. Provide OPENAI_API_KEY to enable chat."

            # Run chat chain
            response = await self.chat_chain.arun(input=message)
            
            logger.info(f"Chat response generated")
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            return "I'm sorry, I encountered an error. Please try again."
    
    async def classify_document_type(self, text: str) -> Dict[str, Any]:
        """
        Robust classification using chat model directly with JSON-only response.
        """
        try:
            if not self.llm:
                return {"document_type": "other", "confidence": 0.5, "reasoning": "LLM not configured"}

            system = SystemMessage(content=(
                "You are an expert at classifying financial documents. "
                "Allowed types: invoice, contract, receipt, financial_statement, other. "
                "Return ONLY a single line of minified JSON with keys: document_type, confidence, reasoning."
            ))
            user = HumanMessage(content=(
                "Classify the following document. Respond with JSON only.\n\n" + text[:5000]
            ))

            ai_message: AIMessage = await self.llm.ainvoke([system, user])  # type: ignore
            raw = ai_message.content if isinstance(ai_message.content, str) else str(ai_message.content)

            # Try to extract JSON
            def parse_first_json(s: str) -> Optional[Dict[str, Any]]:
                s = s.strip()
                # If fenced, strip
                if s.startswith("```"):
                    s = re.sub(r"^```(json)?|```$", "", s, flags=re.IGNORECASE | re.MULTILINE).strip()
                try:
                    return json.loads(s)
                except Exception:
                    match = re.search(r"\{[\s\S]*\}", s)
                    if match:
                        try:
                            return json.loads(match.group(0))
                        except Exception:
                            return None
                return None

            data = parse_first_json(raw) or {}

            # Normalize type
            doc_type_raw = str(data.get("document_type", "other")).lower().strip()
            mapping = {
                "financial statement": "financial_statement",
                "financial_statement": "financial_statement",
                "statement": "financial_statement",
                "bill": "receipt",
                "receipt": "receipt",
                "invoice": "invoice",
                "agreement": "contract",
                "contract": "contract",
            }
            doc_type = mapping.get(doc_type_raw, doc_type_raw)
            if doc_type not in {"invoice", "contract", "receipt", "financial_statement", "other"}:
                doc_type = "other"

            confidence = data.get("confidence")
            try:
                confidence_val = float(confidence) if confidence is not None else 0.5
            except Exception:
                confidence_val = 0.5

            reasoning = str(data.get("reasoning", ""))[:500]

            return {"document_type": doc_type, "confidence": confidence_val, "reasoning": reasoning}

        except Exception as e:
            logger.error(f"Error classifying document: {e}")
            return {"document_type": "other", "confidence": 0.0, "reasoning": str(e)}
    
    async def extract_financial_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract financial entities from document text
        """
        try:
            extraction_prompt = """
            Extract financial entities from the following document text.
            
            Document Text:
            {text}
            
            Extract and return as JSON:
            {{
                "total_amount": 1234.56,
                "currency": "USD",
                "invoice_number": "INV-001",
                "vendor_name": "Company Name",
                "vendor_address": "Address",
                "date": "2024-01-01",
                "due_date": "2024-02-01",
                "line_items": [
                    {{
                        "description": "Item description",
                        "quantity": 1,
                        "unit_price": 100.00,
                        "total": 100.00
                    }}
                ]
            }}
            """
            
            prompt = PromptTemplate(
                input_variables=["text"],
                template=extraction_prompt
            )
            
            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = await chain.arun(text=text)
            
            try:
                return json.loads(result)
            except json.JSONDecodeError:
                return {}
                
        except Exception as e:
            logger.error(f"Error extracting financial entities: {e}")
            return {}
