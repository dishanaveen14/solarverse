# Git Lab Experiments

This README contains the four Git experiments from the supplied lab
handout.

------------------------------------------------------------------------

## Experiment 1 --- Git Init + Commit

**Aim:** Create a Git repository and make the first commit.

### Commands

``` bash
mkdir exp1-git-init
cd exp1-git-init

git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git config --list

echo "# Git Repository" > README.md

git status
git add README.md
git commit -m "initial commit"

git status
git log --oneline
```

**Remember:** - `git init` creates a repository. - `git add` stages
changes. - `git commit` saves the staged changes.

------------------------------------------------------------------------

## Experiment 2 --- Branch + Login Page

**Aim:** Create a feature branch and `login.html`.

### 1. Create a new independent repository

``` bash
mkdir exp2-login-page
cd exp2-login-page

git init
git branch -M main
git config user.name "Your Name"
git config user.email "your.email@example.com"

echo "# Login Page" > README.md
git add README.md
git commit -m "initial commit"
```

### 2. Create a feature branch

``` bash
git switch -c feature/login-page
```

### 3. Create `login.html`

Create the file using your preferred editor. The original handout uses
Nano:

``` bash
nano login.html
```

Add this HTML:

``` html
<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
</head>
<body>
    <label for="username">Username:</label>
    <input type="text" id="username" name="username">
</body>
</html>
```

In Nano, save with `Ctrl+O`, press `Enter`, and exit with `Ctrl+X`.

### 4. Commit and check

``` bash
git add login.html
git commit -m "add login form"

git branch
git log --oneline --graph --all
```

`git branch` shows the local branches; the asterisk (`*`) marks the
current branch.

------------------------------------------------------------------------

## Experiment 3 --- Merge Conflict

**Aim:** Edit the same configuration line on two branches and resolve
the merge conflict.

### 1. Create a repository

``` bash
mkdir exp3-merge-conflict
cd exp3-merge-conflict

git init
git branch -M main
git config user.name "Your Name"
git config user.email "your.email@example.com"

echo "# Merge Conflict" > README.md
git add README.md
git commit -m "initial commit"
```

### 2. Add a configuration file on `main`

``` bash
nano config.json
```

Add:

``` json
{"theme":"light","version":"1.0.0"}
```

Then commit it:

``` bash
git add config.json
git commit -m "add config"
```

### 3. Change the theme to dark on a new branch

``` bash
git switch -c fix/dark-mode
nano config.json
```

Change `light` to `dark`, then save the file and commit:

``` bash
git add config.json
git commit -m "dark mode"
```

### 4. Change `main` to solarized

``` bash
git switch main
nano config.json
```

Change `light` to `solarized`, then save the file and commit:

``` bash
git add config.json
git commit -m "solarized theme"
```

### 5. Merge and resolve the conflict

``` bash
git merge fix/dark-mode
git status
nano config.json
```

Resolve the conflict by removing the conflict markers:

``` text
<<<<<<<
=======
>>>>>>>
```

Keep the intended final content. The handout's example resolution is:

``` json
{"theme":"solarized","version":"1.0.0"}
```

Save the file, then finish the merge:

``` bash
git add config.json
git commit -m "resolve merge conflict"

git status
cat config.json
```

In Nano, save with `Ctrl+O`, press `Enter`, and exit with `Ctrl+X`.

------------------------------------------------------------------------

## Experiment 4 --- GitHub Issue + Pull Request

**Aim:** Push a project to GitHub, create an Issue and Pull Request, add
a comment, and merge the Pull Request.

### 1. Create a local repository

``` bash
mkdir exp4-github
cd exp4-github

git init
git branch -M main
git config user.name "Your Name"
git config user.email "your.email@example.com"

echo "# Campus Portal" > README.md
git add README.md
git commit -m "initial commit"
```

### 2. Create a feature branch and login page

``` bash
git switch -c feature/login-page
nano login.html
```

Add the following HTML:

``` html
<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
</head>
<body>
    <label for="username">Username:</label>
    <input type="text" id="username" name="username">
</body>
</html>
```

Save with `Ctrl+O`, press `Enter`, and exit with `Ctrl+X`.

Commit the file:

``` bash
git add login.html
git commit -m "add login form"
```

### 3. Create an empty GitHub repository

On GitHub.com, create an empty repository named `campus-portal`.

Do not initialize it with a README, license, or `.gitignore`. Copy its
HTTPS URL.

### 4. Connect the local repository and push

Replace `USER` with your GitHub username:

``` bash
git remote add origin https://github.com/USER/campus-portal.git
git remote -v

git switch main
git push -u origin main

git switch feature/login-page
git push -u origin feature/login-page
```

### 5. Create an Issue

On GitHub: 1. Open **Issues**. 2. Select **New Issue**. 3. Set the title
to **Implement Login Page Validation**. 4. Create the issue and note its
issue number.

### 6. Create a Pull Request

On GitHub: 1. Open **Pull requests** and select **New Pull Request**. 2.
Set **Base** to `main`. 3. Set **Compare** to `feature/login-page`. 4.
In the description, add `Closes #1`, replacing `1` with the actual issue
number. 5. Create the Pull Request.

### 7. Comment and merge the Pull Request

Add this comment to the Pull Request:

> The login form input has been added. Please ensure that the field is
> validated before submission.

Ensure that the login field is validated before submission. Then, on
GitHub, select **Merge pull request** and confirm the merge.

**Remember:** - Push `main` first. - Replace `USER` with your GitHub
username. - Replace the example issue number with the actual issue
number.
