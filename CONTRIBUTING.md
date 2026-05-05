# Contributing to InFlux

Thank you for your interest in contributing to InFlux! This document provides guidelines and instructions for contributing.

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `staging` - Pre-production testing
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit with meaningful messages
7. Push to your fork
8. Create a Pull Request

## Commit Messages

Follow conventional commit format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add favorite stations feature
fix: resolve station search bug
docs: update API documentation
```

## Code Style

### Backend
- Use ESLint and Prettier
- Follow JavaScript best practices
- Use async/await for async operations
- Add error handling

### Frontend
- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Ensure responsive design

## Testing

### Backend
- Write unit tests for new features
- Ensure tests pass: `npm test`
- Maintain >= 80% coverage for core endpoints

### Frontend
- Write component tests
- Test user interactions
- Ensure tests pass: `npm test`

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Request review from maintainers
4. Address review comments
5. Wait for approval before merging

## Code Review Guidelines

- Review code for correctness and style
- Check for security issues
- Verify tests are adequate
- Ensure documentation is updated

## Questions?

Open an issue or contact the maintainers.











