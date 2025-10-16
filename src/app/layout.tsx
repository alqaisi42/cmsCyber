import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import {QueryProvider} from "../presentation/providers/query-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: '3lababee Admin Portal',
    description: 'Administrative portal for managing users, providers, products, and lockers',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <QueryProvider>
            {children}
        </QueryProvider>
        </body>
        </html>
    );
}