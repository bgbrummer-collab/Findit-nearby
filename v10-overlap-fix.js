(()=>{
  if(document.getElementById('finditV10OverlapFix'))return;
  const s=document.createElement('style');
  s.id='finditV10OverlapFix';
  s.textContent=`
    #v10CommandCentre .v10-launch button,
    #v10CommandCentre .v10-tools button{
      position:relative!important;
      display:grid!important;
      grid-template-columns:auto minmax(0,1fr)!important;
      grid-auto-rows:auto!important;
      align-items:start!important;
      column-gap:12px!important;
      row-gap:0!important;
      padding:18px!important;
      overflow:hidden!important;
      text-align:left!important;
      white-space:normal!important;
    }
    #v10CommandCentre .v10-launch button>span,
    #v10CommandCentre .v10-tools button>span{
      display:block!important;
      min-width:0!important;
      width:100%!important;
      grid-column:2!important;
    }
    #v10CommandCentre .v10-launch button b,
    #v10CommandCentre .v10-tools button b{
      display:block!important;
      line-height:1.2!important;
      margin:0 0 4px!important;
      white-space:normal!important;
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
      grid-column:1 / -1!important;
      grid-row:auto!important;
      width:100%!important;
      min-width:0!important;
      margin:12px 0 0!important;
      padding:10px 0 0!important;
      border-top:1px solid rgba(255,255,255,.08)!important;
      font-size:9px!important;
      line-height:1.45!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
      position:static!important;
      transform:none!important;
    }
    #v10CommandCentre .v10-how b{
      display:inline!important;
      margin:0!important;
      font-size:inherit!important;
      line-height:inherit!important;
    }
    @media(max-width:760px){
      #v10CommandCentre .v10-launch button,
      #v10CommandCentre .v10-tools button{padding:16px!important}
      #v10CommandCentre .v10-how{font-size:10px!important}
    }
  `;
  document.head.appendChild(s);
})();