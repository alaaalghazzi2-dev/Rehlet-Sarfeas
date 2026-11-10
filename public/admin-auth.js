const form=document.getElementById('authForm'),message=document.getElementById('authMessage');
form.onsubmit=async e=>{
 e.preventDefault();const data=Object.fromEntries(new FormData(form)),button=form.querySelector('button');
 if(data.confirmPassword!==undefined&&data.password!==data.confirmPassword){message.textContent='كلمتا المرور غير متطابقتين.';return;}
 delete data.confirmPassword;button.disabled=true;message.textContent='جارٍ التحقق…';
 try{const response=await fetch('/api/auth/'+form.dataset.mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error||'تعذر تسجيل الدخول');
 form.reset();
 if(form.dataset.mode==='login')location.replace('/admin');
 else{message.textContent=form.dataset.mode==='setup'?'تم تفعيل الحساب. انتقل للدخول ببياناتك الجديدة.':'تم تغيير كلمة المرور. سجّل الدخول مجدداً.';const link=document.createElement('a');link.href='/admin';link.textContent=' تسجيل الدخول';message.append(link);}
 }catch(e){message.textContent=e.message||'تعذر الاتصال. حاول مجدداً.';}finally{button.disabled=false;}
};