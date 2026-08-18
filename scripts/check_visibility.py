import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Tentar autenticar como o aluno de teste se possível, ou usar o admin
        # O usuário decoanalytics@outlook.com.br / Aurelio0496@@## é admin
        
        await page.goto("http://localhost:8080/login")
        await page.fill('input[type="email"]', 'decoanalytics@outlook.com.br')
        await page.fill('input[type="password"]', 'Aurelio0496@@##')
        await page.click('button[type="submit"]')
        
        # Esperar carregar o dashboard
        await page.wait_for_url("**/", timeout=10000)
        await asyncio.sleep(2)
        
        print(f"Logged in as admin. URL: {page.url}")
        
        # 1. Verificar se o semestre 6 está selecionado ou selecionar
        await page.screenshot(path="/tmp/browser/dashboard_initial.png")
        
        # Clicar no filtro de semestre
        semester_btn = page.locator('button:has-text("Semestre")')
        if await semester_btn.count() > 0:
            await semester_btn.first.click()
            await asyncio.sleep(1)
            await page.screenshot(path="/tmp/browser/semester_filter_open.png")
            
            # Clicar no 6º Semestre
            target_sem = page.locator('div:has-text("6º Semestre")').last
            if await target_sem.count() > 0:
                await target_sem.click()
                await asyncio.sleep(2)
                print("Selected 6th semester")
            else:
                print("6th semester option not found in dropdown")
        
        await page.screenshot(path="/tmp/browser/dashboard_sem6.png")
        
        # 2. Verificar se a matéria "Sistemas Operacionais e Mobile" aparece
        mobile_subject = page.locator('h3:has-text("Sistemas Operacionais e Mobile")')
        if await mobile_subject.count() > 0:
            print("Subject 'Sistemas Operacionais e Mobile' found!")
            # Clicar para abrir a matéria
            await mobile_subject.first.click()
            await page.wait_for_url("**/materia/**", timeout=5000)
            await asyncio.sleep(2)
            await page.screenshot(path="/tmp/browser/subject_page_mobile.png")
            
            # Verificar se tem o botão de Caderno
            caderno_btn = page.locator('button:has-text("Caderno de Estudos")')
            if await caderno_btn.count() > 0:
                print("Caderno de Estudos button found, clicking...")
                await caderno_btn.first.click()
                await page.wait_for_url("**/apostila/**", timeout=5000)
                await asyncio.sleep(2)
                await page.screenshot(path="/tmp/browser/reader_page.png")
                
                # Verificar se o conteúdo de Shell Script está visível
                content = await page.content()
                if "Shell Script" in content:
                    print("SUCCESS: Shell Script content found in reader")
                else:
                    print("FAILURE: Shell Script content NOT found in reader")
            else:
                print("FAILURE: Caderno de Estudos button NOT found")
        else:
            print("FAILURE: Subject 'Sistemas Operacionais e Mobile' NOT found in dashboard")

        # 3. Verificar se outras matérias do 6º semestre aparecem (Ex: Aspectos Teóricos)
        await page.goto("http://localhost:8080/")
        await asyncio.sleep(2)
        theory_subject = page.locator('h3:has-text("Aspectos Teóricos da Computação")')
        if await theory_subject.count() > 0:
            print("Subject 'Aspectos Teóricos da Computação' found!")
        else:
            print("FAILURE: Subject 'Aspectos Teóricos da Computação' NOT found")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
