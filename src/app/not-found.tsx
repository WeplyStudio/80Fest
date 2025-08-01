
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchX, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
            <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit">
                <SearchX className="w-12 h-12 text-destructive" />
            </div>
          <CardTitle className="font-headline mt-4 text-5xl font-bold">404</CardTitle>
          <CardDescription className="text-xl font-semibold">
            Halaman Tidak Ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Maaf, halaman yang Anda cari tidak ada atau mungkin telah dipindahkan.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button asChild>
                <Link href="/">
                    <Home className="mr-2" />
                    Kembali ke Beranda
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
