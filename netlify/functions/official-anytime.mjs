// v5.6: Retired. The Anytime source was removed at user request.
// Keep a harmless unscheduled stub so copying this update over v5.5 removes its old cron schedule.
export default async function(){return new Response(JSON.stringify({retired:true,message:'v5.6: 営業対象から除外済み'}),{headers:{'Content-Type':'application/json'}});}
