import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <main className="flex flex-col items-center justify-center space-y-12">
        <h1 className="text-6xl font-bold text-center">
          Welcome to Quizz page👋
        </h1>
        <a href="./quizz">
          <Button className="w-64 h-14 text-lg">Start</Button>
        </a>
      </main>
    </div>
  )
}
