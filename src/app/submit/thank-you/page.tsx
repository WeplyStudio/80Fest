
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Home } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
            <div className="mx-auto bg-green-100 p-3 rounded-full w-fit">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          <CardTitle className="font-headline mt-4 text-2xl">Pengiriman Berhasil!</CardTitle>
          <CardDescription className="text-base">
            Terima kasih atas partisipasimu dalam Lomba Desain Poster 80Fest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Karyamu telah kami terima dan akan segera ditinjau oleh panitia. Kamu bisa melihat karya pilihan lainnya di galeri setelah proses kurasi selesai.
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
