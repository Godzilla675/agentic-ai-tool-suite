import os
import sys
import json
import logging
import tempfile
import shutil
from pathlib import Path
from mcp.server.fastmcp import FastMCP
from playwright.async_api import async_playwright
from dotenv import load_dotenv
from typing import List, Dict, Any # Import typing helpers
from PIL import Image # Import Pillow

# Configure logging
logging.basicConfig(level=logging.INFO, stream=sys.stderr, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables (though none are strictly needed for this server)
load_dotenv()

# --- Server Setup ---
mcp = FastMCP(
    "pdf-creator-server",
    version="0.1.0",
    title="PDF Creator Server",
    description="Generates PDF documents from HTML content.",)


# --- Tool Implementation ---
@mcp.tool()
async def create_pdf_from_html(html_content: str, filename: str = "document") -> str:
    """
    Generates a PDF document from a string containing HTML code.

    Args:
        html_content: A string containing the full HTML code for the document.
        filename: The desired base name for the output PDF file (without extension).

    Returns:
        The absolute path to the generated .pdf file or an error message.
    """
    logging.info(f"Received request to create PDF: {filename}.pdf")
    temp_dir = None
    html_path = None
    try:
        if not isinstance(html_content, str) or not html_content.strip():
            return "Error: html_content must be a non-empty string."

        # Create a temporary directory and file for the HTML
        temp_dir = tempfile.mkdtemp(prefix="mcp_pdf_")
        html_path = os.path.join(temp_dir, "content.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        logging.info(f"Saved HTML to temporary file: {html_path}")

        # Launch Playwright and generate PDF
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            await page.goto(f"file://{html_path}")

            # Take full page screenshot
            img_path = os.path.join(temp_dir, "screenshot.png")
            await page.screenshot(path=img_path, full_page=True)
            logging.info(f"Screenshot saved to temporary file: {img_path}")

            await browser.close()

            # Convert screenshot image to PDF using Pillow
            downloads_path = Path.home() / "Downloads"
            downloads_path.mkdir(parents=True, exist_ok=True)
            output_filename = f"{filename}.pdf"
            output_path = downloads_path / output_filename

            try:
                image = Image.open(img_path)
                # Ensure image is in RGB mode for saving as PDF
                image = image.convert('RGB')
                image.save(output_path, "PDF", resolution=100.0) # Save as PDF
            except Exception as img_err:
                 logging.error(f"Error converting image to PDF: {img_err}")
                 raise img_err # Re-raise to be caught by the main handler

        final_path = str(output_path.resolve())
        logging.info(f"PDF (from screenshot) saved to: {final_path}")
        return f"PDF successfully created and saved to: {final_path}"

    except Exception as e:
        logging.exception("An error occurred during PDF creation.")
        return f"Error creating PDF: {e}"
    finally:
        # Clean up temporary directory/file
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                logging.info(f"Cleaned up temporary directory: {temp_dir}")
            except Exception as e:
                logging.error(f"Error cleaning up temporary directory {temp_dir}: {e}")


# --- Server Execution ---
if __name__ == "__main__":
    logging.info("Starting PDF Creator Server...")
    mcp.run(transport='stdio')
    logging.info("PDF Creator Server stopped.")
