import re
from datetime import datetime

def escape_markdown(text: str) -> str:
    """
    Escape Markdown special characters.
    Telegram supports the following characters as special in Markdown:
    _ * [ ] ( ) ~ ` > # + - = | { } . !
    """
    escape_chars = r'_*[]()~`>#+-=|{}.!'
    return ''.join(f'\\{c}' if c in escape_chars else c for c in str(text))

def format_sensor_data(data: dict) -> str:
    """Format sensor data with proper Markdown escaping."""
    try:
        return f"""
🔍 *Pembacaan Sensor:*
• Suhu: *{data.get('suhu', 'N/A')}°C*
• Kelembaban: *{data.get('kelembaban', 'N/A')}%*
• pH: *{data.get('ph', 'N/A')}*
• Nutrisi: *{data.get('nutrisi', 'N/A')} PPM*
• Status: _{escape_markdown(data.get('status', 'N/A'))}_
"""
    except Exception as e:
        return str(data)  # Fallback to plain text if formatting fails

def format_summary(summary: str) -> str:
    """Format summary data with proper Markdown escaping."""
    try:
        # Replace bullet points and clean up the text
        summary = summary.replace('-', '•')
        summary = re.sub(r'\s+', ' ', summary)
        return escape_markdown(summary)
    except Exception as e:
        return summary  # Fallback to plain text if formatting fails

def parse_date_query(message: str) -> datetime:
    """
    Extract date from query message.
    Supports formats like "tanggal 17", "17 april", etc.
    """
    # Remove common words
    message = message.lower()
    message = message.replace('tanggal', '')
    message = message.replace('pada', '')
    
    # Try to extract date
    try:
        # Match patterns like "17", "17 april", etc.
        date_match = re.search(r'(\d{1,2})(?:\s+([a-zA-Z]+))?', message)
        if date_match:
            day = int(date_match.group(1))
            month = datetime.now().month  # Default to current month
            year = datetime.now().year
            
            # If month is specified
            if date_match.group(2):
                month_map = {
                    'januari': 1, 'jan': 1,
                    'februari': 2, 'feb': 2,
                    'maret': 3, 'mar': 3,
                    'april': 4, 'apr': 4,
                    'mei': 5, 'may': 5,
                    'juni': 6, 'jun': 6,
                    'juli': 7, 'jul': 7,
                    'agustus': 8, 'aug': 8,
                    'september': 9, 'sep': 9,
                    'oktober': 10, 'oct': 10,
                    'november': 11, 'nov': 11,
                    'desember': 12, 'dec': 12
                }
                month_str = date_match.group(2).lower()
                if month_str in month_map:
                    month = month_map[month_str]
            
            return datetime(year, month, day)
    except Exception:
        pass
    
    return None

def safe_markdown_message(text: str) -> str:
    """
    Create a safely formatted Markdown message.
    Falls back to plain text if Markdown formatting fails.
    """
    try:
        # Basic Markdown cleaning
        text = text.replace('*', '\\*')
        text = text.replace('_', '\\_')
        text = text.replace('`', '\\`')
        text = text.replace('[', '\\[')
        
        # Ensure no consecutive newlines (Telegram limit)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text
    except Exception as e:
        # If any error in formatting, return plain text
        return f"Note: Formatting failed, showing plain text:\n\n{text}"
