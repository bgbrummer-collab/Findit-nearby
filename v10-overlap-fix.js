(()=>{
  if(document.getElementById('finditV10OverlapFix'))return;
  const s=document.createElement('style');
  s.id='finditV10OverlapFix';
  s.textContent=`
    #v10CommandCentre .v10-launch button,
    #v10CommandCentre .v10-tools button{
      position:relative!important;
      display:flex!important;
      align-items:flex-start!important;
      gap:12px!important;
      padding:18px!important;
      overflow:hidden!important;
      text-align:left!important;
    }
    #v10CommandCentre .v10-launch button>span,
    #v10CommandCentre .v10-tools button>span{
      display:block!important;
      flex:1 1 auto!important;
      min-width:0!important;
    }
    #v10CommandCentre .v10-launch button b,
    #v10CommandCentre .v10-tools button b{
      display:block!important;
      line-height:1.2!important;
      margin:0 0 4px!important;
    }
    #v10CommandCentre .v10-launch button small,
    #v10CommandCentre .v10-tools button small{
      display:block!important;
      line-height:1.35!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
    }
    #v10CommandCentre .v10-how{
      display:block!important;
      width:100%!important;
      flex:0 0 100%!important;
      clear:both!important;
      margin:10px 0 0!important;
      padding:10px 0 0!important;
      border-top:1px solid rgba(255,255,255,.08)!important;
      font-size:9px!important;
      line-height:1.45!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
    }
    #v10CommandCentre .v10-launch button:has(.v10-how),
    #v10CommandCentre .v10-tools button:has(.v10-how){
      flex-wrap:wrap!important;
      align-content:flex-start!important;
    }
    @media(max-width:760px){
      #v10CommandCentre .v10-launch button,
      #v10CommandCentre .v10-tools button{padding:16px!important}
      #v10CommandCentre .v10-how{font-size:10px!important}
    }
  `;
  document.head.appendChild(s);
})();