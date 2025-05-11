import UploadDoc from "../UploadDoc";
import { auth, signIn } from "@/auth";
import { getUserSubscription } from "@/actions/userSubscriptions";
import UpgradePlan from "../Upgradeplan";

const page = async () => {
    const session = await auth();
    const userId = session?.user?.id;
    if(!userId){
        signIn();
        return;
    }
    const subscribed = await getUserSubscription({ userId});


    return (
        <div className="flex flex-col flex-1">
            <main className="py-11 flex flex-col text-center gap-4 items-center flex-1 mt-24">
                {subscribed ? <div>
                <h2 className=" text-3xl font-bold mb-4">What do you want to be quizzed about today?</h2>
                <UploadDoc />
                </div> : 
                <UpgradePlan />
                }
            </main>
        </div>
    )
}

export default page;