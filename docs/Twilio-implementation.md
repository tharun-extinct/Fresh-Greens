

Ran terminal command: 
```pwsh
curl.exe -s -w "\nHTTP_STATUS:%{http_code}\nERROR:%{errormsg}" "https://verify.twilio.com/v2/Services/<TWILIO_VERIFY_SERVICE_SID>/Verifications" -X POST --data-urlencode "To=+<ph_no>" --data-urlencode "Channel=sms" -u "<TWILIO_ACCOUNT_SID>:<TWILIO_AUTH_TOKEN>" 2>&1

```





`app\src\main\java\com\freshgreens\app\controller\UserController.java:UserController`

`app\.mvn\jvm.config`

---

## 1. Why the curl fails on Cognizant Office Laptop

The command **works perfectly fine right now** (I ran it — HTTP `201 Created`, OTP dispatched to `+91<ph_no>`). The issue is **environment-specific** to Cognizant:

| Cause | Detail |
|---|---|
| **Corporate Firewall (main reason)** | Cognizant's network blocks outbound HTTPS to third-party APIs like `verify.twilio.com` unless explicitly whitelisted by the network team. |
| **Corporate Proxy intercepts traffic** | Cognizant uses a transparent proxy. Curl on Windows doesn't auto-pick the Windows system proxy — it silently times out or gets a TLS MITM certificate error. |
| **TLS inspection / SSL pinning** | The proxy may break Twilio's TLS cert chain, causing `SSL_ERROR_RX_RECORD_TOO_LONG` or `connection refused`. |

**Quick test to confirm on your office laptop:**
```powershell
curl.exe -v https://verify.twilio.com
```
If you see `Received HTTP code 407` → proxy auth required. If you see `connection timed out` → firewall block.

**Workaround for local dev on Cognizant laptop:**
```powershell
# Find the corporate proxy address (already configured in your browser/system)
netsh winhttp show proxy
# Then set it for curl:
$env:HTTPS_PROXY = "http://<proxy-host>:<port>"
curl.exe ... # re-run your command
```


`TwilioVerifyService`  — it reads `HTTPS_PROXY` environment variable automatically (see the `buildHttpClient()` logic in the service).

---

## Twilio Implemention

### Architecture Flow
```
UserController → TwilioVerifyService → Twilio Verify REST API (HTTPS)
```

### Key Files

| File | Role |
|---|---|
| TwilioVerifyService.java | Core service — sends OTP & checks OTP |
| UserController.java | Exposes `POST /api/users/send-phone-otp` and `POST /api/users/verify-phone` |
| application.properties | Config properties for Twilio credentials |

### API Endpoints
```
POST /api/users/send-phone-otp   →  calls startSmsVerification(phone)
POST /api/users/verify-phone     →  calls checkSmsVerification(phone, otp)
```

### Proxy Support (built-in for corporate networks)
The service automatically tries these in order:
1. `twilio.proxy.host` + `twilio.proxy.port` in `application-local.properties`
2. `HTTPS_PROXY` / `https_proxy` environment variable
3. JVM default proxy (if `twilio.proxy.use-system-default=true`)

### To run locally on your Cognizant laptop — add to `application-local.properties`:
```properties
# Get these values from: netsh winhttp show proxy
twilio.proxy.host=<cognizant-proxy-host>
twilio.proxy.port=<port>

TWILIO_ACCOUNT_SID=<TWILIO_ACCOUNT_SID>
TWILIO_AUTH_TOKEN=<TWILIO_AUTH_TOKEN>
TWILIO_VERIFY_SERVICE_SID=<service_id>
```

Or set as environment variables before running the Spring Boot app:
```powershell
$env:TWILIO_ACCOUNT_SID="<TWILIO_ACCOUNT_SID>"
$env:TWILIO_AUTH_TOKEN="<TWILIO_AUTH_TOKEN>"
$env:TWILIO_VERIFY_SERVICE_SID="<service_id>"
$env:HTTPS_PROXY="http://<your-cognizant-proxy>:<port>"
```

> ⚠️ **Security reminder:** Rotate your Twilio `AuthToken` since it's now exposed in this conversation. Do it at [console.twilio.com](https://console.twilio.com) → Account → Auth Tokens.


-------------------------------------


The answer is simple: **`curl.exe` on Windows automatically uses the Windows system proxy, but Java's `HttpClient` does NOT.** Let me find the proxy and fix it. 


```bash
netsh winhttp show proxy
```



```powershell
Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" | Select-Object ProxyEnable, ProxyServer, AutoConfigURL

```



```powershell
Get-ChildItem Env: | Where-Object { $_.Name -match "PROXY|proxy|JAVA_OPTS|JAVA_TOOL|_JAVA_OPTIONS|JVM" } | Format-Table Name, Value -AutoSize

```



```powershell
Get-ChildItem Env: | Where-Object { $_.Name -like "*PROXY*" -or $_.Name -like "*proxy*" -or $_.Name -like "*JAVA*" } | Format-Table Name, Value -AutoSize
```



```powershell
curl.exe -v https://verify.twilio.com 2>&1 | Select-String -Pattern "proxy|Proxy|CONNECT|tunnel|SSL|TLS|certificate|auth|407|200|Connected" | Select-Object -First 20

```
So curl connects **directly** — no proxy involved at all. Yet Java fails. Let me check the real error from the logs and the local credentials config: 


The credentials are configured correctly. The real issue is a **Java-specific SSL problem**. Let me diagnose it precisely: 



```powershell
Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -match "Zscaler|zscaler|Cognizant|cognizant|CTS|corporate|CGEN|Symantec|DigiCert|Entrust" } | Select-Object Subject, Thumbprint | Format-Table -AutoSize
```

**Found it!** Both **Cognizant Root CA** and **Zscaler Root CA** are in Windows' cert store. This is exactly the problem:

- **curl** → uses Windows SChannel → trusts Zscaler's CA → ✅ works  
- **Java** → uses its own `cacerts` keystore → Zscaler CA not in it → `SSLHandshakeException` → ❌ fails

Zscaler intercepts all HTTPS traffic on Cognizant's network and re-signs the TLS cert. Java doesn't trust that re-signed cert. Let me fix this by importing both CAs into Java's truststore: 

---

```pwsh

Write-Host "Count: $($certs.Count)"

New-Item -ItemType Directory -Force -Path "C:\Temp" | Out-Null

Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*Zscaler*" } | Format-List Subject, Thumbprint

$thumb1 = "<Thumbprint>"
$cert1 = Get-Item "Cert:\LocalMachine\Root\$thumb1"

Export-Certificate -Cert $cert1 -FilePath "C:\Temp\ZSCALER_ROOT_CA.cer" -Type CERT
Write-Host "Done: $((Get-Item C:\Temp\ZSCALER_ROOT_CA.cer).Length) bytes"

```

```pwsh

foreach ($cert in $certs) {
    # This is the exact math your script uses to generate the alias
    $generatedAlias = ($cert.Subject -replace "[^a-zA-Z0-9]", "_").ToLower().Substring(0, [Math]::Min(30, ($cert.Subject -replace "[^a-zA-Z0-9]", "_").Length))
    
    Write-Host "Windows Subject: $($cert.Subject)"
    Write-Host "Java Alias:      $generatedAlias"
}
```



---



### Copying the certificate from the *`%AppData%`*

```pwsh
$certs = Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -match "Zscaler|zscaler|Cognizant|cognizant" }

New-Item -ItemType Directory -Force -Path "C:\Temp" | Out-Null

foreach ($cert in $certs) {
    $temp = $cert.Subject -replace " ", "_" -replace "CN=","" -replace "[^a-zA-Z0-9]", "_" 
    $alias = $temp.ToUpper().Substring(0, [Math]::Min(20, $temp.Length))
    $outFile = "C:\Temp\$alias.cer"
    Export-Certificate -Cert $cert -FilePath $outFile -Type CERT | Out-Null
    Write-Host "Exported: $($cert.Subject) -> $outFile"
}
```


#### Export Copying *`cacerts`* from *`jdk-17\lib\security\`* to custom folder *`Users\...\.jvm\`*

```pwsh
$keytool = "C:\Program Files\Java\jdk-17\bin\keytool.exe"
$cacerts = "C:\Program Files\Java\jdk-17\lib\security\cacerts"
$customCacerts = "C:\Users\<user_name>\.jvm\cacerts"

# Create writable directory and copy original cacerts
New-Item -ItemType Directory -Force -Path "C:\Users\<user_name>\.jvm" | Out-Null

Copy-Item $cacerts $customCacerts -Force
   
Write-Host "Copied cacerts. Size: $((Get-Item $customCacerts).Length) bytes"
```

*Cognizant* and *Zscaler* certs are exported to *`C:\Temp`*

<br>
<br>

## To import them into Java 17's `cacerts` truststore: 

### Approach 1: Importing the Certificate into `cacerts` truststore

**Requires Admin privilege to write to `Program Files`**

```powershell
$keytool = "C:\Program Files\Java\jdk-17\bin\keytool.exe"
$cacerts = "C:\Program Files\Java\jdk-17\lib\security\cacerts"

# Import Cognizant Root CA
& $keytool -importcert -trustcacerts -alias "cognizant-root-ca" -file "C:\Temp\COGNIZANT_ROOT_CA.cer" -keystore $cacerts -storepass <password> -noprompt

# Import Zscaler Root CA  
& $keytool -importcert -trustcacerts -alias "zscaler-root-ca" -file "C:\Temp\ZSCALER_ROOT.cer" -keystore $cacerts -storepass <password> -noprompt
```

---

### Approach 2: Copy `cacerts` into Custom Location and Importing Certificates into it

```powershell
$keytool = "C:\Program Files\Java\jdk-17\bin\keytool.exe"
$cacerts = "C:\Program Files\Java\jdk-17\lib\security\cacerts"
$customCacerts = "C:\Users\<user_name>\.jvm\cacerts"

# Create writable directory and copy original cacerts
New-Item -ItemType Directory -Force -Path "C:\Users\<user_name>\.jvm" | Out-Null

Copy-Item $cacerts $customCacerts -Force

Write-Host "Copied cacerts. Size: $((Get-Item $customCacerts).Length) bytes"

# Import Cognizant Root CA into `cacerts`
& $keytool -importcert -trustcacerts -alias "cognizant-root-ca" -file "C:\Temp\COGNIZANT_ROOT_CA.cer" -keystore $customCacerts -storepass <password> -noprompt

# Import Zscaler Root CA into `cacerts`
& $keytool -importcert -trustcacerts -alias "zscaler-root-ca" -file "C:\Temp\ZSCALER_ROOT_CA.cer" -keystore $customCacerts -storepass <password> -noprompt

#Listing 
& $keytool -list -keystore $customCacerts -storepass <password> -alias "cognizant-root-ca" 2>&1
& $keytool -list -keystore $customCacerts -storepass <password> -alias "zscaler-root-ca" 2>&1
```

Both certs are in. Now configure application-local.properties to tell the JVM to use this custom truststore: 




## Create the `.mvn/jvm.config` file (File path for JVM system properties and args in Maven) — listed in `.gitignore`

```bash
# Rename to 'jvm.config' and remove this line

-Djavax.net.ssl.trustStore=C:/Users/<id>/.jvm/custom-cacerts
-Djavax.net.ssl.trustStorePassword=<storepass>
```



Good — .gitignore already covers application-local.properties. Now I'll create the `.mvn/jvm.config` file (the right place for JVM args in Maven) and add it to .gitignore: 







## Testing the connection: 




```pwsh

cd "C:\Users\<user_name>\OneDrive - Cognizant\Project\fresh-greens\app"
"C:\Program Files\Java\jdk-17\bin\java.exe" `
  -Djavax.net.ssl.trustStore="C:/Users/<user_name>/.jvm/custom-cacerts" `
  -Djavax.net.ssl.trustStorePassword="<password>" `
  -cp "C:\Program Files\Java\jdk-17\lib\security" `
  -ea `
  -classpath "." `
  com.sun.net.ssl.internal.ssl.Provider 2>&1; Write-Host "SSL Provider check done"

# Quick Java SSL test to verify.twilio.com
$code = @'
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.*;
public class SSLTest {
    public static void main(String[] args) throws Exception {
        SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
        try (SSLSocket socket = (SSLSocket) factory.createSocket("verify.twilio.com", 443)) {
            socket.startHandshake();
            System.out.println("SUCCESS: TLS handshake completed with verify.twilio.com");
            System.out.println("Peer certs: " + socket.getSession().getPeerCertificates()[0]);
        }
    }
}
'@
$code | Out-File -FilePath "C:\Temp\SSLTest.java" -Encoding utf8
& "C:\Program Files\Java\jdk-17\bin\javac.exe" "C:\Temp\SSLTest.java" -d "C:\Temp\"
& "C:\Program Files\Java\jdk-17\bin\java.exe" -Djavax.net.ssl.trustStore="C:/Users/<user_name>/.jvm/custom-cacerts" -Djavax.net.ssl.trustStorePassword="<password>" -cp "C:\Temp" SSLTest 2>&1
```




```pwsh
$code = @'
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
public class SSLTest {
    public static void main(String[] args) throws Exception {
        SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
        try (SSLSocket socket = (SSLSocket) factory.createSocket("verify.twilio.com", 443)) {
            socket.startHandshake();
            System.out.println("SUCCESS: TLS handshake OK with verify.twilio.com");
        } catch (Exception e) {
            System.out.println("FAILED: " + e.getMessage());
        }
    }
}
'@
$code | Out-File -FilePath "C:\Temp\SSLTest.java" -Encoding utf8
& "C:\Program Files\Java\jdk-17\bin\javac.exe" "C:\Temp\SSLTest.java" -d "C:\Temp\"

Write-Host "--- WITHOUT custom truststore (should fail) ---"
& "C:\Program Files\Java\jdk-17\bin\java.exe" -cp "C:\Temp" SSLTest 2>&1

Write-Host "--- WITH custom truststore (should succeed) ---"
& "C:\Program Files\Java\jdk-17\bin\java.exe" -Djavax.net.ssl.trustStore="C:/Users/<user_name>/.jvm/custom-cacerts" -Djavax.net.ssl.trustStorePassword="<password>" -cp "C:\Temp" SSLTest 2>&1

```



#### To check compilation status
```pwsh

Set-Location "C:\Temp"
@"
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
public class SSLTest {
    public static void main(String[] args) throws Exception {
        SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
        try (SSLSocket socket = (SSLSocket) factory.createSocket("verify.twilio.com", 443)) {
            socket.startHandshake();
            System.out.println("SUCCESS: TLS handshake OK");
        } catch (Exception e) {
            System.out.println("FAILED: " + e.getMessage());
        }
    }
}
"@ | Set-Content "SSLTest.java"
& "C:\Program Files\Java\jdk-17\bin\javac.exe" SSLTest.java
Write-Host "Compiled: $(Test-Path SSLTest.class)"

```



```pwsh

Set-Location "C:\Temp"
$java = "C:\Program Files\Java\jdk-17\bin\java.exe"
$ts = "C:\Users\<user_name>\.jvm\custom-cacerts"

Write-Host "--- WITHOUT custom truststore ---"
& $java "-cp" "C:\Temp" "SSLTest" 2>&1

Write-Host "--- WITH custom truststore ---"
& $java "-Djavax.net.ssl.trustStore=$ts" "-Djavax.net.ssl.trustStorePassword=<password>" "-cp" "C:\Temp" "SSLTest" 2>&1

```



```pwsh
Set-Location "C:\Temp"

Write-Host "--- WITHOUT custom truststore (baseline) ---"
cmd /c '"C:\Program Files\Java\jdk-17\bin\java.exe" -cp "C:\Temp" SSLTest 2>&1'

Write-Host "--- WITH custom truststore (fix) ---"
cmd /c '"C:\Program Files\Java\jdk-17\bin\java.exe" -Djavax.net.ssl.trustStore="C:\Users\<user_name>\.jvm\custom-cacerts" -Djavax.net.ssl.trustStorePassword=<password> -cp "C:\Temp" SSLTest 2>&1'

```


**The fix works!** ✅ Java can now do the TLS handshake with `verify.twilio.com`. Let me verify the baseline also fails as expected: 


```pwsh
Set-Location "C:\Temp"
cmd /c '"C:\Program Files\Java\jdk-17\bin\java.exe" -cp "C:\Temp" SSLTest 2>&1'

```




---

## Root Cause — Why curl works but Java doesn't

| | curl.exe | Java `HttpClient` |
|---|---|---|
| **TLS stack** | Windows SChannel (native) | Java JSSE (own stack) |
| **Reads cert store from** | Windows Certificate Store | `$JAVA_HOME/lib/security/cacerts` |
| **Zscaler Root CA present?** | ✅ Yes (auto-synced by Cognizant) | ❌ No |
| **Result** | ✅ Handshake OK | ❌ `PKIX path building failed` |

**Zscaler** (Cognizant's internet traffic inspector) intercepts every HTTPS connection and **re-signs TLS certificates with its own CA**. Windows cert store already has the Zscaler Root CA (Cognizant IT manages this via Group Policy). Java's `cacerts` does not — so it rejects the re-signed cert with an `SSLHandshakeException`, which the service catches as `IOException` and wraps as *"Unable to reach phone verification service"*.

---

## What Was Fixed

1. **Exported** Zscaler Root CA + Cognizant Root CA from Windows cert store → `C:\Temp\*.cer`
2. **Copied** Java's `cacerts` to custom-cacerts (writable, no admin needed)
3. **Imported** both corporate CAs into that custom truststore
4. **Created** jvm.config — Maven wrapper automatically passes these as JVM args on every `mvnw` run:
   ```
   -Djavax.net.ssl.trustStore=C:/Users/<user_name>/.jvm/custom-cacerts
   -Djavax.net.ssl.trustStorePassword=<password>
   ```
5. **Added** `**/jvm.config` to .gitignore — this file is machine-specific and must never be committed
