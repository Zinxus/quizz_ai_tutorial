import Link from "next/link"

const Header = () => {
    return (
        <header>
            <nav className="px-4 py-2.5 flex gap-2">
                <Link className=" underline" href={"/quizz"}>Sample Quizz</Link>
                <Link className=" underline" href={"/quizz/new"}>New Quizz</Link>
            </nav>
        </header>
    )
}

export default Header;