import os
import re

# Mapping of emojis to text descriptors
EMOJI_MAP = {
    "[TARGET]": "[TARGET]",
    "[CRITICAL]": "[CRITICAL]",
    "[HIGH]": "[HIGH]",
    "[MEDIUM]": "[MEDIUM]",
    "[OK]": "[OK]",
    "[DONE]": "[COMPLETE]",
    "[ERROR]": "[MISSING]",
    "[WARNING]": "[WARNING]",
    "[STATS]": "[STATS]",
    "[TIP]": "[TIP]",
    "[PRODUCTION]": "[DEPLOY]",
    "[SUCCESS]": "[SUCCESS]",
    "[SPARKLE]": "[NEW]",
    "[INFO]": "[INFO]",
    "[TIME]": "[TIME]",
    "[CONFIG]": "[SETUP]",
    "[SEARCH]": "[SEARCH]",
    "[FAST]": "[FAST]",
    "[SECURITY]": "[SECURITY]",
    "[TEST]": "[TEST]",
    "[FILE]": "[FILE]",
    "[CONFIG]": "[TOOLS]",
    "[DONE]": "[DONE]",
    "[ERROR]": "[ERROR]",
    "[PRODUCTION]": "[START]",
    "[DESIGN]": "[DESIGN]",
    "[CONFIG]": "[CONFIG]",
    "[DOCS]": "[DOCS]",
    "[PRODUCTION]": "[PRODUCTION]",
    "[FIRE]": "[INCIDENT]",
    "[ALERT]": "[ALERT]",
    "[BUILD]": "[BUILD]",
    "[PACKAGE]": "[PACKAGE]",
    "[SHIP]": "[SHIP]",
    "[CONNECTED]": "[CONNECTED]",
    "[BLOCKER]": "[BLOCKER]",
    "[LINK]": "[LINK]",
    "[KEY]": "[KEY]",
    "[SECURE]": "[SECURE]",
    "[OPEN]": "[OPEN]",
    "[VIEW]": "[VIEW]",
    "[CHAT]": "[CHAT]",
    "[UP]": "[UP]",
    "[DOWN]": "[DOWN]",
    "[CHEERS]": "[CHEERS]",
    "[HELLO]": "[HELLO]",
    "[COLLAB]": "[COLLAB]",
    "[THANKS]": "[THANKS]",
    "[STRENGTH]": "[STRENGTH]",
    "[BRAIN]": "[BRAIN]",
    "[AGENT]": "[AGENT]",
    "[SETTINGS]": "[SETTINGS]",
    "[DESKTOP]": "[DESKTOP]",
    "[CODE]": "[CODE]",
    "[MOBILE]": "[MOBILE]",
    "[WEB]": "[WEB]",
    "[WORLD]": "[WORLD]",
    "[COLOR]": "[COLOR]",
    "[STAR]": "[STAR]",
    "[GLOW]": "[GLOW]",
    "[SPARKLE]": "[SPARKLE]",
    "[BOOM]": "[BOOM]",
    "[FAST]": "[FAST]",
    "[WATER]": "[WATER]",
    "[DROP]": "[DROP]",
    "[FIRE]": "[FIRE]",
    "[BUILD]": "[BUILD]",
    "[MINE]": "[MINE]",
    "[STEP]": "[STEP]",
    "[INFRA]": "[INFRA]",
    "[BLOCK]": "[BLOCK]",
    "[CHAIN]": "[CHAIN]",
    "[CART]": "[CART]",
    "[BAG]": "[BAG]",
    "[GIFT]": "[GIFT]",
    "[TICKET]": "[TICKET]",
    "[TICKET]": "[TICKET]",
    "[RIBBON]": "[RIBBON]",
    "[ROSETTE]": "[ROSETTE]",
    "[MEDAL]": "[MEDAL]",
    "[TROPHY]": "[TROPHY]",
    "[MEDAL]": "[MEDAL]",
    "[GOLD]": "[GOLD]",
    "[SILVER]": "[SILVER]",
    "[BRONZE]": "[BRONZE]",
}

def remove_emojis_from_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = content
        for emoji, text in EMOJI_MAP.items():
            new_content = new_content.replace(emoji, text)

        # Catch-all for any other emojis using regex
        # This regex covers most emojis (Basic Multilingual Plane and supplemental planes)
        emoji_pattern = re.compile(
            "["
            "\U0001f600-\U0001f64f"  # emoticons
            "\U0001f300-\U0001f5ff"  # symbols & pictographs
            "\U0001f680-\U0001f6ff"  # transport & map symbols
            "\U0001f1e0-\U0001f1ff"  # flags (iOS)
            "\U00002702-\U000027b0"
            "\U000024c2-\U0001f251"
            "]+", flags=re.UNICODE
        )
        new_content = emoji_pattern.sub(lambda m: "", new_content)

        if content != new_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    base_dir = r"c:\Users\ashut\OneDrive\Documents\elastic hackathon"
    extensions = {".md", ".jsx", ".js", ".tsx", ".ts", ".py", ".sh", ".yml", ".html", ".env", ".example", ".txt"}
    exclude_dirs = {"node_modules", ".git", ".next", "build", "dist"}

    modified_count = 0
    for root, dirs, files in os.walk(base_dir):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            file_path = os.path.join(root, file)
            _, ext = os.path.splitext(file)
            if ext in extensions:
                if remove_emojis_from_file(file_path):
                    print(f"Cleaned: {file_path}")
                    modified_count += 1

    print(f"\nDone! Cleaned emojis from {modified_count} files.")

if __name__ == "__main__":
    main()
