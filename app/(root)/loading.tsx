import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
    // This is the global layout skeleton for the Dashboard
    return (
        <section className="home">
            <div className="home-content">
                <header className="home-header">
                    <div className="flex flex-col gap-2">
                        {/* Title skeleton */}
                        <Skeleton className="h-8 w-[250px]" />
                        {/* Subtitle skeleton */}
                        <Skeleton className="h-4 w-[350px]" />
                    </div>

                    {/* Total balance box skeleton */}
                    <div className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-chart sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                        <Skeleton className="h-[120px] w-[120px] rounded-full" />
                        <div className="flex flex-col gap-6">
                            <Skeleton className="h-6 w-[150px]" />
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-8 w-[200px]" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Recent transactions section skeleton */}
                <div className="recent-transactions">
                    <header className="flex items-center justify-between">
                        <Skeleton className="h-6 w-[200px]" />
                        <Skeleton className="h-8 w-[100px] rounded-full" />
                    </header>
                    
                    <div className="mt-6 flex flex-col gap-4">
                        <Skeleton className="h-[50px] w-full" /> {/* Tabs */}
                        <div className="flex flex-col gap-2 mt-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-md" /> // Table rows
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right sidebar skeleton */}
            <div className="no-scrollbar flex h-screen max-w-[355px] flex-col gap-8 bg-gray-50 dark:bg-gray-800/20 px-4 py-8 max-xl:hidden xl:w-[355px]">
                {/* Profile section */}
                <div className="flex flex-col items-center justify-center gap-2">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-6 w-[150px] mt-2" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
                
                {/* Banks section */}
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-6 w-[120px]" />
                    <Skeleton className="h-[150px] w-full rounded-xl" />
                    <Skeleton className="h-[150px] w-full rounded-xl mt-4" />
                </div>
            </div>
        </section>
    );
}
