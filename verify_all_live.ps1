$ErrorActionPreference = "Stop"

Write-Host "=== 1. Checking Health Endpoint ==="
$health = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get
Write-Host "Health status: $($health.status)"

Write-Host "`n=== 2. Testing Teacher Login & Assignment Creation ==="
$loginBody = @{
    email = "teacher@physim.edu"
    password = "TeacherPassword123!"
} | ConvertTo-Json

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session
Write-Host "Logged in teacher: $($loginRes.user.email), Role: $($loginRes.user.role)"

# Get teacher classrooms
$classroomRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/teacher/classrooms" -Method Get -WebSession $session
$classrooms = $classroomRes.classrooms

if (-not $classrooms -or $classrooms.Count -eq 0) {
    Write-Host "Creating classroom for testing..."
    $createClassBody = @{ name = "Live Physics Lab" } | ConvertTo-Json
    $createdClass = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/teacher/classrooms" -Method Post -Body $createClassBody -ContentType "application/json" -WebSession $session
    $classroomId = $createdClass.id
    $classroomCode = $createdClass.code
} else {
    $classroomId = $classrooms[0].id
    $classroomCode = $classrooms[0].code
}

Write-Host "Target Classroom ID: $classroomId, Join Code: $classroomCode"

# Create an assignment with date format as sent by HTML5 date input (e.g. "2026-10-15")
$assignBody = @{
    title = "Live Verification Assignment"
    instructions = "Complete the Ohm's law simulation and report resistance."
    experimentId = "ohms-law"
    dueDate = "2026-10-15"
} | ConvertTo-Json

$createRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/teacher/classrooms/$classroomId/assignments" -Method Post -Body $assignBody -ContentType "application/json" -WebSession $session
Write-Host "Successfully created assignment: ID=$($createRes.id), Title='$($createRes.title)', DueAt='$($createRes.dueAt)'"

# Fetch assignments to verify persistence
$detailsRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/teacher/classrooms/$classroomId" -Method Get -WebSession $session
$assignments = $detailsRes.assignments
$found = $assignments | Where-Object { $_.id -eq $createRes.id }
if ($found) {
    Write-Host "Assignment successfully verified in classroom assignments list! Count=$($assignments.Count)"
} else {
    Write-Error "Assignment not found in assignments list!"
}

Write-Host "`n=== 3. Testing Google OAuth Authorize Endpoint ==="
$oauthAuthRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/oauth/google/authorize" -Method Get
Write-Host "Google OAuth Authorize Response received:"
Write-Host "State: $($oauthAuthRes.state)"
Write-Host "AuthUrl snippet: $($oauthAuthRes.authUrl.Substring(0, [Math]::Min(100, $oauthAuthRes.authUrl.Length)))..."

if ($oauthAuthRes.authUrl -match "code_challenge=" -and $oauthAuthRes.authUrl -match "state=" -and $oauthAuthRes.authUrl -match "nonce=") {
    Write-Host "Google OAuth URL properly contains code_challenge, state, and nonce!"
} else {
    Write-Error "Google OAuth URL missing required PKCE/OIDC parameters!"
}

Write-Host "`n=== 4. Regression: Student Classroom Join Flow ==="
# Create student
$studentEmail = "student_live_$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.com"
$studentBody = @{
    name = "Live Student"
    email = $studentEmail
    password = "StudentSecret123!"
} | ConvertTo-Json

$studentSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$studentSignup = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/signup" -Method Post -Body $studentBody -ContentType "application/json" -WebSession $studentSession
Write-Host "Registered student: $($studentSignup.user.email)"

# Join classroom
$joinBody = @{
    code = $classroomCode
} | ConvertTo-Json

$joinRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/teacher/classrooms/join" -Method Post -Body $joinBody -ContentType "application/json" -WebSession $studentSession
Write-Host "Student joined classroom: $($joinRes.name) (Code: $($joinRes.code))"

# Check student enrolled classrooms
$enrolled = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/teacher/classrooms/enrolled" -Method Get -WebSession $studentSession
Write-Host "Student enrolled classrooms count: $($enrolled.classrooms.Count)"

Write-Host "`n>>> ALL LIVE VERIFICATIONS PASSED SUCCESSFULLY! <<<"
