'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

const Menu = () => {
  const router = useRouter();

  return (
    <div className="flex justify-center">
      <Menubar className="bg-white">
        <MenubarMenu>
          <MenubarTrigger
            className="hover:bg-gray-200 transition-colors duration-200"
            onClick={() => router.push('/K-core')}
          >
            K-Core
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger
            className="hover:bg-gray-200 transition-colors duration-200"
            onClick={() => router.push('/K-clique')}
          >
            K-Clique
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger
            className="hover:bg-gray-200 transition-colors duration-200"
            onClick={() => router.push('/K-truss')}
          >
            K-Truss
          </MenubarTrigger>
        </MenubarMenu>
      </Menubar>
    </div>
  );
};

export default Menu;