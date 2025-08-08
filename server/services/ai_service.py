from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage
import logging
import json
from typing import Dict, List, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model_name=settings.OPENAI_MODEL,
            temperature=0.1,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        # Initialize chains
        self.document_analysis_chain = self._create_document_analysis_chain()
        self.query_chain = self._create_query_chain()
        self.chat_chain = self._create_chat_chain()
        
        # Memory for chat
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
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
        
        return LLMChain(
            llm=self.llm, 
            prompt=prompt,
            memory=self.memory
        )
    
    async def analyze_document(self, text: str, file_path: str) -> Dict[str, Any]:
        """
        Analyze a document and extract structured information
        """
        try:
            logger.info(f"Analyzing document: {file_path}")
            
            # Run document analysis chain
            result = await self.document_analysis_chain.arun(text=text)
            
            # Parse JSON response
            try:
                analysis = json.loads(result)
                logger.info(f"Document analysis completed: {analysis.get('document_type')}")
                return analysis
            except json.JSONDecodeError:
                logger.error(f"Failed to parse AI response as JSON: {result}")
                return {
                    "document_type": "other",
                    "confidence": 0.5,
                    "entities": {},
                    "summary": "Analysis failed"
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
            
            # Run query chain
            response = await self.query_chain.arun(
                query=query,
                context=context_str
            )
            
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
            
            # Run chat chain
            response = await self.chat_chain.arun(input=message)
            
            logger.info(f"Chat response generated")
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            return "I'm sorry, I encountered an error. Please try again."
    
    async def classify_document_type(self, text: str) -> Dict[str, Any]:
        """
        Classify document type
        """
        try:
            classification_prompt = """
            Classify the following document text into one of these categories:
            - invoice
            - contract
            - receipt
            - financial_statement
            - other
            
            Document Text:
            {text}
            
            Provide response as JSON:
            {{"document_type": "type", "confidence": 0.95, "reasoning": "explanation"}}
            """
            
            prompt = PromptTemplate(
                input_variables=["text"],
                template=classification_prompt
            )
            
            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = await chain.arun(text=text)
            
            try:
                return json.loads(result)
            except json.JSONDecodeError:
                return {"document_type": "other", "confidence": 0.5, "reasoning": "Failed to parse"}
                
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
