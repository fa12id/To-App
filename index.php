<?php
require_once 'auth.php';

if (isset($_SESSION['user'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = $conn->real_escape_string($_POST['username']);
    $p = $_POST['password'];

    $sql = "SELECT id, password FROM users WHERE username='$u'";
    $res = $conn->query($sql);

    if ($res && $res->num_rows === 1) {
        $row = $res->fetch_assoc();
        if (password_verify($p, $row['password'])) {
            $_SESSION['user'] = $u;
            header('Location: dashboard.php');
            exit;
        }
    }
    $error = 'Invalid credentials';
}
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Login – To-Do App</title>
    <link rel="stylesheet" href="style.css"/>
</head>
<body>
<div class="app-container" style="max-width:380px">
    <h2>Login</h2>
    <?php if ($error): ?>
        <p style="color:#ff4d4d"><?= $error ?></p>
    <?php endif; ?>
    <form method="post">
        <input type="text" name="username" placeholder="Username" required/>
        <input type="password" name="password" placeholder="Password" required/>
        <button class="btn" type="submit">Login</button>
    </form>
    <p>Belum punya akun? <a href="register.php" style="color:#00ffcc">Daftar</a></p>
</div>
</body>
</html>