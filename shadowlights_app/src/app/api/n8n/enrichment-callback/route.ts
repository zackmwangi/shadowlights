import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function POST(request: NextRequest) {
 

    const cookieStore = await cookies();
  
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
  
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );


          },
        },
      }
    );
  

  try {
  
    //const { task_id, user_id, title_enriched, description_enriched, output }  = reqB;
    const { task_id, user_id, title_enriched, description_enriched, output }  = await request.json();

    if(!task_id || !user_id || !title_enriched || !description_enriched){
      return NextResponse.json({ error: 'Missing required fields '}, { status: 400 })
    }

    // Update the task with the new, enriched description.
    const { data, error } = await supabase
      .from('tasks')
      //.update({ description: description })
      //.eq('id', taskId)
      //.eq('user_id', userId)
      .update({ description_enriched: description_enriched, title_enriched: title_enriched })
      .eq('id', task_id)
      .eq('user_id', user_id)
      .select()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Task enriched successfully', data: data[0] })
    //fetchTasks()
    
  } catch (err) {
    console.error('Error processing webhook:', err)
    return NextResponse.json({ error: 'Internal Server Error: '+err }, { status: 500 })
  }
}
