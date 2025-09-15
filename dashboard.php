<?php
require_once 'auth.php';
if (!isset($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}
/* simply output the original todo.html so the user can use the app */
readfile('todo.html');
?>