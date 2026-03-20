import os
import sys

def check_structure():
    required_dirs = ['directives', 'execution', '.tmp']
    required_files = ['.env', 'AGENTS.md']
    errors = []

    for d in required_dirs:
        if not os.path.isdir(d):
            errors.append(f"Missing directory: {d}")
    
    for f in required_files:
        if not os.path.isfile(f):
            errors.append(f"Missing file: {f}")

    if errors:
        print("System Health Check: FAILED")
        for error in errors:
            print(f" - {error}")
        sys.exit(1)
    else:
        print("System Health Check: PASSED")
        print("Core architecture directories and files are present.")

if __name__ == "__main__":
    check_structure()
