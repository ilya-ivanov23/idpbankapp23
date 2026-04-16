import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
    return (
        <div className="transactions">
            <div className="transactions-header">
                <Skeleton className="h-8 w-[250px] mb-2" />
                <Skeleton className="h-5 w-[350px]" />
            </div>

            <div className="space-y-6">
                <div className="transactions-account">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[180px] mt-2" />
                    </div>

                    <div className='transactions-account-balance flex flex-col justify-end items-end'>
                        <Skeleton className="h-4 w-[120px] mb-2" />
                        <Skeleton className="h-8 w-[150px]" />
                    </div>
                </div>

                <section className="flex w-full flex-col gap-6">
                    {/* Table Skeleton */}
                    <div className="w-full border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b flex justify-between">
                            <Skeleton className="h-4 w-[20%]" />
                            <Skeleton className="h-4 w-[15%]" />
                            <Skeleton className="h-4 w-[15%]" />
                            <Skeleton className="h-4 w-[15%]" />
                            <Skeleton className="h-4 w-[15%]" />
                            <Skeleton className="h-4 w-[5%]" />
                        </div>
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <Skeleton className="h-4 w-[20%]" />
                                <Skeleton className="h-4 w-[10%]" />
                                <Skeleton className="h-6 w-[8%] rounded-full" />
                                <Skeleton className="h-4 w-[15%]" />
                                <Skeleton className="h-6 w-[10%] rounded-full" />
                                <Skeleton className="h-8 w-[6%] rounded-full" />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
