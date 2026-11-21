import re
import html


def clean_text(text):
    """
    Clean and normalize threat intelligence text.
    """

    if not text:
        return ""

    text = html.unescape(text)

    text = re.sub(r"<[^>]+>", " ", text)

    text = re.sub(r"\s+", " ", text)

    text = text.strip()

    return text