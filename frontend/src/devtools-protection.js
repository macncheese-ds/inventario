// frontend/src/devtools-protection.js
// ============================================
// TOGGLE THIS TO ENABLE/DISABLE PROTECTION
// ============================================
const ENABLE_DEVTOOLS_PROTECTION = false;
// ============================================

export function initDevToolsProtection() {
  if (!ENABLE_DEVTOOLS_PROTECTION) {
    console.log('DevTools protection is disabled');
    return;
  }

  // 1. Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 2. Disable keyboard shortcuts for DevTools
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C (Inspect element)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (View source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
  });

  // 3. Detect DevTools open via debugger statement (aggressive)
  let devtoolsOpen = false;
  
  const detectDevTools = () => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        onDevToolsOpen();
      }
    } else {
      devtoolsOpen = false;
    }
  };

  // 4. Debugger trap - makes stepping through code annoying
  const debuggerTrap = () => {
    const start = performance.now();
    debugger;
    const end = performance.now();
    
    // If debugger took more than 100ms, DevTools is likely open
    if (end - start > 100) {
      onDevToolsOpen();
    }
  };

  // 5. Action when DevTools is detected
  const onDevToolsOpen = () => {
    // Option A: Clear the page (uncomment to use)
    // document.body.innerHTML = '<h1 style="color:white;text-align:center;margin-top:50px;">DevTools no permitido</h1>';
    
    // Option B: Redirect (uncomment to use)
    // window.location.href = 'about:blank';
    
    // Option C: Just log a warning (current default)
    console.clear();
    console.log('%c⚠️ DevTools detectado', 'font-size: 30px; color: red;');
  };

  // 6. Console clearing loop (makes console harder to use)
  const clearConsole = () => {
    console.clear();
  };

  // Run detections
  setInterval(detectDevTools, 1000);
  setInterval(clearConsole, 2000);
  
  // Run debugger trap less frequently (can be annoying)
  // Uncomment the line below for more aggressive protection
  // setInterval(debuggerTrap, 3000);

  // 7. Disable console methods in production
  if (ENABLE_DEVTOOLS_PROTECTION) {
    const noop = () => {};
    // Uncomment these to completely disable console
    // console.log = noop;
    // console.info = noop;
    // console.warn = noop;
    // console.error = noop;
    // console.debug = noop;
  }

  console.log('%cProtection enabled', 'color: green;');
}
