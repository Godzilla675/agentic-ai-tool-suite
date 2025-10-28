from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="pdf-creator-server-mcp",
    version="0.1.0",
    author="Godzilla675",
    description="MCP server for creating PDF documents from HTML",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Godzilla675/agentic-ai-tool-suite",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    py_modules=["pdf_creator_server"],
    entry_points={
        "console_scripts": [
            "pdf-creator-server=pdf_creator_server:main",
        ],
    },
)
