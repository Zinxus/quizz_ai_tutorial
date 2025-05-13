import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChartBig, CreditCard, Plus, Settings, User } from "lucide-react"
import Link from "next/link"

export function NavMenu() {
  return (

      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link href="/dashboard" className="flex 
            flex-row">
            <BarChartBig className="mr-2 h-4 w-4" />
            Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href='/profile' className=" flex flex-grow">
            <User className="mr-2 h-4 w-4" />
            Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/quizz/new" className=" flex flex-grow">
            <Plus className="mr-2 h-4 w-4" />
            <span>New Quizz</span> 
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/billing" className=" flex flex-grow">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span> 
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>

        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
      </DropdownMenuContent>

  )
}
