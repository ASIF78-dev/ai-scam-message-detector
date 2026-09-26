import re

def extract_urls(text: str) -> list[str]:
    """
    Extract URLs and naked IP addresses from text.
    Handles http://, https://, www., and raw IPv4 hostnames,
    cleaning trailing sentence punctuation (.,;:!?).
    Preserves order and deduplicates.
    """
    if not text:
        return []

    raw_candidates = re.findall(
        r'(?:https?://|www\.)[^\s<>"\'{}|\\^`]+|(?:https?://)?(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:/[^\s<>"\'{}|\\^`]*)?',
        text,
        re.IGNORECASE
    )

    cleaned_urls = []
    for raw in raw_candidates:
        u = re.sub(r'[.,;:!?)]+$', '', raw.strip())
        if u and (
            u.startswith('http://')
            or u.startswith('https://')
            or u.startswith('www.')
            or re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', u)
        ):
            cleaned_urls.append(u)

    seen = set()
    result = []
    for u in cleaned_urls:
        if u not in seen:
            seen.add(u)
            result.append(u)
    return result


def extract_phone_numbers(text: str) -> list[str]:
    """
    Extract phone numbers and suspicious contact strings
    (e.g., +1-800-..., +91..., 10-digit mobile patterns).
    """
    if not text:
        return []

    matches = re.findall(
        r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12}',
        text
    )
    return [m.strip() for m in matches if len(re.sub(r'\D', '', m)) >= 10]


def extract_handles(text: str) -> list[str]:
    """
    Extract Telegram, WhatsApp or social redirection handles (e.g., @t_me, @user).
    """
    if not text:
        return []

    matches = re.findall(r'(?:t\.me/|@)[a-zA-Z0-9_]{4,}', text)
    return list(dict.fromkeys(matches))
