---
title: Git Workflow and Team Collaboration Best Practices
created: 2026-02-10
updated: 2026-02-10
tags: ["git", "version-control", "collaboration", "devops"]
summary: Git workflow strategies and team collaboration best practices for version control
ai_refined: true
---

# Git Workflow and Team Collaboration Best Practices

## Git Branching Strategies

### Git Flow

Classic branching model for release-based projects:

```bash
# Main branches
main (production)
develop (integration)

# Supporting branches
feature/* (new features)
release/* (release preparation)
hotfix/* (production fixes)
```

**Workflow:**

```bash
# Start feature
git checkout develop
git checkout -b feature/user-authentication

# Work on feature
git add .
git commit -m "Add login functionality"

# Finish feature
git checkout develop
git merge --no-ff feature/user-authentication
git branch -d feature/user-authentication

# Create release
git checkout -b release/1.2.0 develop
# Bump version, fix bugs
git checkout main
git merge --no-ff release/1.2.0
git tag -a v1.2.0

# Hotfix
git checkout -b hotfix/1.2.1 main
# Fix critical bug
git checkout main
git merge --no-ff hotfix/1.2.1
git tag -a v1.2.1
```

### GitHub Flow

Simplified workflow for continuous deployment:

```bash
# Create feature branch
git checkout -b feature/add-search

# Make changes and commit
git add .
git commit -m "Implement search functionality"

# Push and create PR
git push origin feature/add-search

# After review, merge to main
# Deploy automatically from main
```

**Best for:**
- Web applications
- Continuous deployment
- Small teams

### Trunk-Based Development

Single main branch with short-lived feature branches:

```bash
# Create short-lived branch
git checkout -b quick-fix

# Make small change
git add .
git commit -m "Fix button alignment"

# Merge quickly (within hours/days)
git checkout main
git merge quick-fix
git branch -d quick-fix
```

**Principles:**
- Commit to main frequently
- Use feature flags for incomplete features
- Keep branches short-lived (< 2 days)

## Commit Best Practices

### Conventional Commits

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```bash
feat(auth): add OAuth2 login support

Implement OAuth2 authentication flow with Google and GitHub providers.
Includes token refresh mechanism and user profile sync.

Closes #123

fix(api): handle null response in user endpoint

Previously crashed when user not found. Now returns 404 with error message.

docs: update installation instructions

refactor(utils): simplify date formatting logic

test(auth): add integration tests for login flow

chore(deps): upgrade React to v18.2
```

### Atomic Commits

Each commit should represent one logical change:

```bash
# Bad: Multiple unrelated changes
git commit -m "Fix login bug, update README, refactor utils"

# Good: Separate commits
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "docs: update API documentation"
git commit -m "refactor(utils): extract date helpers"
```

### Writing Good Commit Messages

**Structure:**

```
Short summary (50 chars or less)

More detailed explanation (wrap at 72 chars). Explain what and why,
not how. Include motivation for the change and contrast with previous
behavior.

- Bullet points are okay
- Use imperative mood: "Add feature" not "Added feature"
- Reference issues: Fixes #123, Closes #456
```

## Pull Request Workflow

### Creating PRs

```bash
# Update your branch
git checkout main
git pull origin main
git checkout feature/new-feature
git rebase main

# Push changes
git push origin feature/new-feature

# Create PR on GitHub/GitLab
```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Code Review Guidelines

**For Authors:**
- Keep PRs small (< 400 lines)
- Provide context in description
- Respond to feedback promptly
- Don't take criticism personally

**For Reviewers:**
- Review within 24 hours
- Be constructive and specific
- Ask questions, don't demand
- Approve when satisfied

## Merge Strategies

### Merge Commit

```bash
git merge --no-ff feature/branch
```

**Pros:** Preserves history, shows feature boundaries
**Cons:** Cluttered history with merge commits

### Squash and Merge

```bash
git merge --squash feature/branch
git commit -m "feat: add new feature"
```

**Pros:** Clean linear history
**Cons:** Loses individual commit history

### Rebase and Merge

```bash
git checkout feature/branch
git rebase main
git checkout main
git merge feature/branch
```

**Pros:** Linear history, preserves commits
**Cons:** Rewrites history (don't rebase public branches)

## Conflict Resolution

### Handling Merge Conflicts

```bash
# Update your branch
git checkout feature/branch
git fetch origin
git rebase origin/main

# Conflicts appear
# Edit conflicted files
git add resolved-file.js
git rebase --continue

# Or abort
git rebase --abort
```

### Conflict Markers

```javascript
<<<<<<< HEAD
const greeting = "Hello World";
=======
const greeting = "Hi there";
>>>>>>> feature/branch
```

**Resolution:**

```javascript
const greeting = "Hello World";
```

## Advanced Git Techniques

### Interactive Rebase

```bash
# Rebase last 3 commits
git rebase -i HEAD~3

# Options:
# pick - keep commit
# reword - change message
# edit - amend commit
# squash - combine with previous
# fixup - like squash, discard message
# drop - remove commit
```

### Cherry-Pick

```bash
# Apply specific commit to current branch
git cherry-pick abc123
```

### Stash

```bash
# Save work in progress
git stash save "WIP: feature implementation"

# List stashes
git stash list

# Apply stash
git stash apply stash@{0}

# Apply and remove
git stash pop

# Clear all stashes
git stash clear
```

### Bisect

Find bug-introducing commit:

```bash
git bisect start
git bisect bad  # Current version is bad
git bisect good v1.0  # v1.0 was good

# Git checks out middle commit
# Test and mark
git bisect good  # or bad

# Repeat until found
git bisect reset
```

## Git Hooks

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run linter
npm run lint
if [ $? -ne 0 ]; then
  echo "Linting failed. Commit aborted."
  exit 1
fi

# Run tests
npm test
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

### Using Husky

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.js": ["eslint --fix", "git add"],
    "*.css": ["stylelint --fix", "git add"]
  }
}
```

## Team Collaboration

### Branch Naming Conventions

```
feature/user-authentication
bugfix/login-error
hotfix/critical-security-patch
release/v1.2.0
docs/api-documentation
refactor/database-layer
```

### Protected Branches

Configure on GitHub/GitLab:
- Require PR reviews
- Require status checks
- Require signed commits
- Restrict who can push

### Code Owners

```
# .github/CODEOWNERS
* @team-lead

/frontend/** @frontend-team
/backend/** @backend-team
/docs/** @tech-writers

package.json @team-lead
```

## Git Configuration

### Global Config

```bash
# User info
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Editor
git config --global core.editor "code --wait"

# Aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
```

### Useful Aliases

```bash
# Pretty log
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# Undo last commit
git config --global alias.undo 'reset HEAD~1 --mixed'

# Amend without editing message
git config --global alias.amend 'commit --amend --no-edit'
```

## Troubleshooting

### Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)

```bash
git reset --hard HEAD~1
```

### Recover Deleted Branch

```bash
git reflog
git checkout -b recovered-branch abc123
```

### Remove File from History

```bash
git filter-branch --tree-filter 'rm -f passwords.txt' HEAD
```

### Clean Untracked Files

```bash
# Preview
git clean -n

# Remove files
git clean -f

# Remove directories
git clean -fd
```

## Best Practices Summary

- Commit early and often
- Write meaningful commit messages
- Keep branches short-lived
- Review code thoroughly
- Use branch protection
- Automate with hooks
- Document workflows
- Communicate with team

> Version control is not just about code - it's about collaboration and communication.
