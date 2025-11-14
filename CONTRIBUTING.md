# Contributing to Evolve

First off, thank you for considering contributing to Evolve! 🎉

It's people like you that make Evolve such a great tool for the health and wellness community.

## 🤔 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues list to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
- **Description**: Clear and concise description of the bug
- **Steps to Reproduce**: Numbered steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable, add screenshots
- **Environment**:
  - OS: [e.g., Windows 11, macOS 13]
  - Browser: [e.g., Chrome 120, Safari 17]
  - Node version: [e.g., 18.17.0]

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title**: Use a descriptive title
- **Detailed description**: Explain the enhancement in detail
- **Use cases**: Describe scenarios where this would be useful
- **Mockups**: If applicable, add mockups or examples
- **Alternatives**: Describe alternatives you've considered

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: Run `npm install`
3. **Make your changes**: Follow our code standards
4. **Test your changes**: Ensure everything works
5. **Update documentation**: Update README or docs if needed
6. **Write good commit messages**: Use conventional commits format
7. **Submit your PR**: Provide a clear description of changes

## 💻 Development Process

### Setting Up Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/evolve.git
cd evolve

# Add upstream remote
git remote add upstream https://github.com/iodmijares/evolve.git

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your API keys to .env

# Start development server
npm run dev
```

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Adding tests
- `chore/description` - Maintenance tasks

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(dashboard): add workout completion tracking
fix(scanner): resolve image upload error on iOS
docs(readme): update installation instructions
```

## 📝 Code Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types, avoid `any`
- Use interfaces for object shapes
- Export types that might be reused

```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
  age: number;
}

// Bad
const user: any = { id: '1', name: 'John' };
```

### React Components

- Use functional components with hooks
- Props should be typed with interfaces
- Use `React.FC` or explicit return types
- Implement proper error handling

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

### File Organization

- One component per file
- Co-locate related files (Component.tsx + styles)
- Use index files for clean imports
- Keep utilities in `utils/` folder

### Styling

- Use the theme system from `styles/theme.ts`
- Follow existing color palette
- Support both light and dark modes
- Use inline styles with theme colors

### Validation

- Validate all user inputs
- Use `utils/validation.ts` helpers
- Sanitize HTML content
- Handle edge cases

```typescript
import { validateMealData } from '../utils/validation';

const result = validateMealData(mealData);
if (!result.valid) {
  setError(result.errors.join(', '));
  return;
}
```

### Error Handling

- Use try-catch for async operations
- Provide user-friendly error messages
- Use `getHumanReadableError()` utility
- Log errors for debugging

```typescript
try {
  await logMeal(mealData);
} catch (error) {
  const message = getHumanReadableError(error);
  setError(message);
}
```

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR, test:
- [ ] Feature works as expected
- [ ] No console errors or warnings
- [ ] Works in light and dark mode
- [ ] Responsive on mobile and desktop
- [ ] Handles error cases gracefully
- [ ] No TypeScript compilation errors

### Testing Different Scenarios

- Test with empty states
- Test with maximum data
- Test with invalid inputs
- Test network failures
- Test on different browsers

## 📚 Documentation

### Code Comments

- Comment complex logic
- Explain "why" not "what"
- Use JSDoc for functions
- Keep comments up-to-date

```typescript
/**
 * Generates a personalized workout plan based on user's fitness level and goals.
 * Uses AI to create a balanced 30-day program.
 * 
 * @param user - User profile with fitness level and goals
 * @returns Promise<WorkoutPlan> - Generated workout plan
 */
async function generateWorkoutPlan(user: UserProfile): Promise<WorkoutPlan> {
  // Implementation
}
```

### README Updates

If your PR changes functionality:
- Update relevant sections in README
- Add new features to feature list
- Update screenshots if UI changed
- Update setup instructions if needed

## 🔍 Code Review Process

### What We Look For

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it clean and maintainable?
- **Performance**: Is it optimized?
- **Security**: Are inputs validated?
- **Documentation**: Is it well-documented?
- **Tests**: Are edge cases handled?

### Responding to Feedback

- Be open to suggestions
- Ask questions if unclear
- Make requested changes
- Push updates to same branch
- Reply to comments

## 🎯 Priority Areas

We're especially interested in contributions for:

- 🧪 **Testing**: Adding automated tests
- ♿ **Accessibility**: Improving a11y
- 🌍 **Internationalization**: Adding language support
- 📱 **Mobile**: React Native version
- 🔌 **Integrations**: Wearables, fitness apps
- 📊 **Analytics**: Better insights and charts
- 🎨 **UI/UX**: Design improvements

## ❓ Questions?

- Check [existing issues](../../issues)
- Start a [discussion](../../discussions)
- Read the [README](README.md)
- Check [documentation](#)

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Evolve! 💚

Together, we're building something amazing for the health and wellness community! 🌱
