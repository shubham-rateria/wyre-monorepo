import subprocess
import os
from datetime import datetime, timedelta

# Configuration
repo_path = '/Users/rateria/Code/wyre-monorepo'  # Path to your local git repository
years_to_shift = 1  # Number of years to shift the commit dates

# Function to run shell commands
def run_command(command):
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE)
    return result.stdout.decode('utf-8').strip()

# Enter the repository
os.chdir(repo_path)

# Fetch all commits
commits = run_command('git rev-list --all').split('\n')

# Function to change the date of a commit
def change_commit_date(commit_hash, years):
    # Get the original commit date
    original_date = run_command(f'git show -s --format=%ci {commit_hash}')

    # Parse and shift the date
    shifted_date = datetime.strptime(original_date, '%Y-%m-%d %H:%M:%S %z') + timedelta(days=years*365)

    # Set the new date in the environment variables
    os.environ['GIT_COMMITTER_DATE'] = shifted_date.strftime("%Y-%m-%d %H:%M:%S")
    os.environ['GIT_AUTHOR_DATE'] = shifted_date.strftime("%Y-%m-%d %H:%M:%S")

    # Amend the commit without changing its content
    run_command(f'git checkout {commit_hash}')
    run_command('git commit --amend --no-edit --date "' + shifted_date.strftime("%Y-%m-%d %H:%M:%S") + '"')
    run_command(f'git replace {commit_hash} HEAD')

# Change the date of each commit
for commit in commits:
    change_commit_date(commit, years_to_shift)

# Apply the replacements permanently
# run_command('git filter-branch -- --all')

# Clean up
# run_command('git replace -d $(git replace -l)')
# run_command('git checkout main')  # or your default branch

# Warning: You will need to force push to update the remote repository
# run_command('git push origin --force --all')
