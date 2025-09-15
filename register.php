<?php
require_once 'auth.php';

if (isset($_SESSION['user'])) {
    header('Location: dashboard.php');
    exit;
}

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = $conn->real_escape_string($_POST['username']);
    $p = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, password) VALUES ('$u', '$p')";
    if ($conn->query($sql)) {
        $_SESSION['user'] = $u;          // auto-login
        header('Location: dashboard.php');
        exit;
    } else {
        $msg = 'Username sudah dipakai';
    }
}
?>
<!doctype html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Register – To-Do App</title>
    <link rel="stylesheet" href="style.css"/>
</head>
<body>
<div class="app-container" style="max-width:380px">
    <h2>Register</h2>
    <?php if ($msg): ?>
        <p style="color:#ff4d4d"><?= $msg ?></p>
    <?php endif; ?>
    <form method="post">
        <input type="text" name="username" placeholder="Username" required/>
        <input type="password" name="password" placeholder="Password" required/>
        <button class="btn" type="submit">Daftar</button>
    </form>
    <p>Sudah punya akun? <a href="index.php" style="color:#00ffcc">Login</a></p>
</div>
</body>
</html>