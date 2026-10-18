/* Keyboard and screen-reader support for the existing dashboard dialogs. */
(()=>{'use strict';
 const states=new WeakMap();
 window.finditAccessibleDialog=(modal,title)=>{
  const closeSelector='[aria-label="Close"],.fx-stable-close,.fx-info-x,.premium-tool-close,.fx-premium-workspace-close,[data-close-shop]';const close=modal.querySelector(closeSelector);close?.setAttribute?.('aria-label','Close');
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',title||'FindIt');
  let state=states.get(modal);
  const visible=()=>!modal.classList.contains('hidden')&&getComputedStyle(modal).display!=='none';
  const controls=()=>[...modal.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(x=>!x.disabled&&x.tabIndex>=0&&x.getClientRects().length);
  if(!state){state={active:false,previous:null};states.set(modal,state);
   modal.addEventListener('keydown',event=>{
    if(!visible())return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();modal.querySelector(closeSelector)?.click();return;}
    if(event.key!=='Tab')return;const items=controls(),first=items[0],last=items.at(-1);
    if(!first){event.preventDefault();modal.focus();return;}
    if(event.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){event.preventDefault();first.focus();}
   });
   new MutationObserver(()=>{if(state.active&&!visible()){state.active=false;if(state.previous?.isConnected&&(!document.activeElement||document.activeElement===document.body||modal.contains(document.activeElement)))state.previous.focus();}}).observe(modal,{attributes:true,attributeFilter:['class','aria-hidden','style']});
  }
  if(!state.active){state.previous=document.activeElement;state.active=true;}if(!modal.contains(document.activeElement)){const first=modal.querySelector('[autofocus]')||controls()[0];if(first)first.focus();else{modal.tabIndex=-1;modal.focus();}}
 };
})();
