<?php
/**
 * Contact form endpoint.
 * Returns JSON: { ok: bool, message: string }
 *
 * Local WAMP note: PHP's mail() needs a configured SMTP server. If sending
 * fails (the usual case on localhost), the message is still appended to
 * messages.log so nothing is lost, and the front-end falls back to mailto:.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const RECIPIENT = 'chsarmad888@gmail.com';
const LOG_FILE  = __DIR__ . '/messages.log';

function respond(bool $ok, string $message, int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Method not allowed.', 405);
}

// Honeypot: real people leave this hidden field empty.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    respond(true, 'Thanks — your message is on its way.');
}

$name    = trim((string) ($_POST['name'] ?? ''));
$email   = trim((string) ($_POST['email'] ?? ''));
$subject = trim((string) ($_POST['subject'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    respond(false, 'Please fill in your name, email and message.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'That email address does not look valid.', 422);
}

if (mb_strlen($name) > 100 || mb_strlen($subject) > 150 || mb_strlen($message) > 5000) {
    respond(false, 'That message is a little too long — please trim it down.', 422);
}

// Strip CR/LF from anything that lands in a header (header-injection guard).
$safeHeader = static fn (string $v): string => str_replace(["\r", "\n", "%0a", "%0d"], '', $v);

$subject = $subject !== '' ? $subject : 'New portfolio enquiry';
$mailSubject = '[Portfolio] ' . $safeHeader($subject);

$body = "New message from your portfolio\n"
      . str_repeat('-', 40) . "\n"
      . "Name:    {$name}\n"
      . "Email:   {$email}\n"
      . "Subject: {$subject}\n"
      . "Time:    " . date('Y-m-d H:i:s') . "\n"
      . "IP:      " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n"
      . str_repeat('-', 40) . "\n\n"
      . $message . "\n";

$headers = implode("\r\n", [
    'From: Portfolio Contact <no-reply@' . $safeHeader((string) ($_SERVER['SERVER_NAME'] ?? 'localhost')) . '>',
    'Reply-To: ' . $safeHeader($name) . ' <' . $safeHeader($email) . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
]);

// Always keep a local copy first — mail() is unreliable on localhost.
@file_put_contents(LOG_FILE, $body . "\n" . str_repeat('=', 60) . "\n\n", FILE_APPEND | LOCK_EX);

$sent = @mail(RECIPIENT, $mailSubject, $body, $headers);

if ($sent) {
    respond(true, 'Thanks, ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . ' — your message is on its way.');
}

// Mail transport unavailable: tell the front-end so it can open the mail client.
respond(false, 'Mail server unavailable — opening your email app instead…', 200);
