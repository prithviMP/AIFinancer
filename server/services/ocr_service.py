import pytesseract
import pdfplumber
from PIL import Image
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        # Configure tesseract path if needed
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        pass
    
    async def extract_text(self, file_path: str) -> str:
        """
        Extract text from file (PDF or image)
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                return await self._extract_from_image(file_path)
            elif file_extension == '.pdf':
                return await self._extract_from_pdf(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
                
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            return ""
    
    async def _extract_from_image(self, file_path: str) -> str:
        """
        Extract text from image using Tesseract OCR
        """
        try:
            # Open image
            image = Image.open(file_path)
            
            # Extract text using Tesseract
            text = pytesseract.image_to_string(image)
            
            logger.info(f"Extracted {len(text)} characters from image: {file_path}")
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from image {file_path}: {e}")
            return ""
    
    async def _extract_from_pdf(self, file_path: str) -> str:
        """
        Extract text from PDF using pdfplumber
        """
        try:
            text_parts = []
            
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                    logger.info(f"Processed page {page_num + 1} of PDF: {file_path}")
            
            full_text = "\n".join(text_parts)
            logger.info(f"Extracted {len(full_text)} characters from PDF: {file_path}")
            return full_text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {e}")
            return ""
    
    async def extract_text_with_confidence(self, file_path: str) -> dict:
        """
        Extract text with confidence scores
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                return await self._extract_from_image_with_confidence(file_path)
            elif file_extension == '.pdf':
                return await self._extract_from_pdf_with_confidence(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
                
        except Exception as e:
            logger.error(f"Error extracting text with confidence from {file_path}: {e}")
            return {"text": "", "confidence": 0.0}
    
    async def _extract_from_image_with_confidence(self, file_path: str) -> dict:
        """
        Extract text from image with confidence scores
        """
        try:
            image = Image.open(file_path)
            
            # Get text with confidence data
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            # Extract text and calculate average confidence
            text_parts = []
            confidences = []
            
            for i, conf in enumerate(data['conf']):
                if conf > 0:  # Filter out low confidence results
                    text_parts.append(data['text'][i])
                    confidences.append(conf)
            
            text = " ".join(text_parts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            return {
                "text": text.strip(),
                "confidence": avg_confidence / 100.0  # Normalize to 0-1
            }
            
        except Exception as e:
            logger.error(f"Error extracting text with confidence from image {file_path}: {e}")
            return {"text": "", "confidence": 0.0}
    
    async def _extract_from_pdf_with_confidence(self, file_path: str) -> dict:
        """
        Extract text from PDF with confidence estimation
        """
        try:
            text_parts = []
            
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            
            full_text = "\n".join(text_parts)
            
            # Estimate confidence based on text length and quality
            confidence = min(1.0, len(full_text) / 1000.0)  # Simple heuristic
            
            return {
                "text": full_text.strip(),
                "confidence": confidence
            }
            
        except Exception as e:
            logger.error(f"Error extracting text with confidence from PDF {file_path}: {e}")
            return {"text": "", "confidence": 0.0}
    
    async def preprocess_image(self, file_path: str) -> str:
        """
        Preprocess image for better OCR results
        """
        try:
            from PIL import Image, ImageEnhance, ImageFilter
            
            # Open image
            image = Image.open(file_path)
            
            # Convert to grayscale
            if image.mode != 'L':
                image = image.convert('L')
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(2.0)
            
            # Apply slight blur to reduce noise
            image = image.filter(ImageFilter.GaussianBlur(radius=0.5))
            
            # Save preprocessed image
            preprocessed_path = file_path.replace('.', '_preprocessed.')
            image.save(preprocessed_path)
            
            return preprocessed_path
            
        except Exception as e:
            logger.error(f"Error preprocessing image {file_path}: {e}")
            return file_path
