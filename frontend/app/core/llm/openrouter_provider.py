"""OpenRouter LLM Provider implementation."""
import logging
from typing import List, AsyncGenerator, Dict, Any
import aiohttp
import json
from datetime import datetime
from app.core.llm.interfaces import LLMProvider
from app.core.llm.messages import Message, Response, ResponseChunk
from app.core.config import Settings

logger = logging.getLogger(__name__)


class OpenRouterProvider(LLMProvider):
    def __init__(self, settings: Settings):
        self.api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found in settings")
        
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "meta-llama/llama-3.1-70b-instruct"  # Using Llama 3.1 70B
        logger.info(f"✅ OpenRouter provider initialized with model: {self.model}")
    
    async def generate_response(
        self, messages: List[Message], temperature: float = 0.0, max_tokens: int = 4096
    ) -> Response:
        """Generate a non-streaming response."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, headers=headers, json=payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"OpenRouter API error: {error_text}")
                        raise Exception(f"OpenRouter API error: {error_text}")
                    
                    data = await response.json()
                    content = data['choices'][0]['message']['content']
                    return Response(
                        text=content,
                        confidence_score=1.0,
                        created_at=datetime.utcnow(),
                        metadata={'model': self.model}
                    )
                    
        except Exception as e:
            logger.error(f"Error in OpenRouter generate_response: {str(e)}", exc_info=True)
            raise
    
    async def generate_stream(
        self, messages: List[Message], temperature: float = 0.0, max_tokens: int = 4096
    ) -> AsyncGenerator[ResponseChunk, None]:
        """Generate a streaming response."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, headers=headers, json=payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"OpenRouter API error: {error_text}")
                        raise Exception(f"OpenRouter API error: {error_text}")
                    
                    async for line in response.content:
                        if line:
                            line_text = line.decode('utf-8').strip()
                            if line_text.startswith('data: '):
                                data_str = line_text[6:]
                                if data_str == '[DONE]':
                                    yield ResponseChunk(text="", is_complete=True, metadata={})
                                else:
                                    try:
                                        data = json.loads(data_str)
                                        if 'choices' in data and len(data['choices']) > 0:
                                            delta = data['choices'][0].get('delta', {})
                                            if 'content' in delta:
                                                yield ResponseChunk(text=delta['content'], is_complete=False, metadata={})
                                    except json.JSONDecodeError:
                                        logger.warning(f"Failed to parse streaming data: {data_str}")
                                        
        except Exception as e:
            logger.error(f"Error in OpenRouter generate_stream: {str(e)}", exc_info=True)
            raise