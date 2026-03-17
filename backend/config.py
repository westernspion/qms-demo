"""
config.py — Pydantic Settings for the QMS backend.
All values read from environment variables (or .env file).
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "qms"
    db_user: str = "qms"
    db_password: str = "qms"

    ollama_host: str = "http://localhost:11434"
    embed_model: str = "nomic-embed-text"
    llm_model: str = "qwen2.5:7b"

    chunk_size: int = 512
    chunk_overlap: int = 64
    top_k_chunks: int = 5

    frontend_origin: str = "http://localhost:80"

    @property
    def db_dsn(self) -> str:
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def db_dsn_async(self) -> str:
        return (
            f"postgresql+asyncpg://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
