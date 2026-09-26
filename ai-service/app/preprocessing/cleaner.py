import re
import unicodedata

def clean_text(text: str) -> str:
    """
    Standardize raw input message:
    - Normalizes unicode characters (NFKD)
    - Removes zero-width and invisible control characters
    - Converts to lowercase
    - Normalizes whitespace
    """
    if text is None:
        return ""

    text = str(text)

    # Normalize unicode
    text = unicodedata.normalize("NFKD", text)

    # Strip zero-width spaces, joiners, and control characters (except newline/tab)
    text = re.sub(r'[\u200B-\u200D\uFEFF]', '', text)

    # Lowercase
    text = text.lower()

    # Collapse multiple whitespaces
    text = re.sub(r'\s+', ' ', text)

    return text.strip()
