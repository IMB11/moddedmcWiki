import {auth, signIn} from "@/lib/auth";
import {redirect} from "next/navigation";

export default async function Login() {
  const session = (await auth());

  if (session) {
    return redirect('/dev');
  }

  return (
    <form
      action={async () => {
        "use server"
        await signIn("modrinth", { redirectTo: '/dev' })
      }}
    >
      <button type="submit" className="bg-green-600 p-3 px-5 rounded-sm">
        Log in with Modrinth
      </button>
    </form>
  )
}