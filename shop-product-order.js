export function moveVisibleProduct(products, visible, id, direction) {
  const index=visible.findIndex(product=>product.id===id);
  const neighbor=visible[index+direction];
  if(index<0||!neighbor)return false;
  const from=products.findIndex(product=>product.id===id);
  const to=products.findIndex(product=>product.id===neighbor.id);
  [products[from],products[to]]=[products[to],products[from]];
  return true;
}

export function createOrderSaver(products,write,onState,delay=250) {
  const saved=new Map(products.map(product=>[product.id,product.sortOrder]));
  let desired=null,timer=null,running=null;
  const changes=()=>desired?.filter(row=>saved.get(row.id)!==row.sortOrder)||[];
  function flush(){
    clearTimeout(timer);
    if(running)return running;
    running=(async()=>{
      while(changes().length){
        const batch=changes();
        // Finish every request before another snapshot starts, including failures.
        try{await write(batch);}catch(error){batch.forEach(row=>saved.delete(row.id));throw error;}
        batch.forEach(row=>saved.set(row.id,row.sortOrder));
      }
      if(desired)onState('saved');
    })().catch(error=>{onState('error');throw error;}).finally(()=>{running=null;});
    return running;
  }
  return {
    schedule(products){
      desired=products.map((product,sortOrder)=>({id:product.id,sortOrder}));
      onState('saving');clearTimeout(timer);
      timer=setTimeout(()=>flush().catch(()=>{}),delay);
    },
    flush,
    pending:()=>!!running||changes().length>0
  };
}
