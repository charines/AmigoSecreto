import os

# Configurações: pastas e arquivos para ignorar
IGNORE_DIRS = {'node_modules', '.git', 'build', 'dist', 'public'}
IGNORE_FILES = {'package-lock.json', 'yarn.lock', 'out.txt', '.gitignore'}

def gerar_contexto(diretorio_raiz, arquivo_saida):
    with open(arquivo_saida, 'w', encoding='utf-8') as f:
        for root, dirs, files in os.walk(diretorio_raiz):
            # Filtra pastas ignoradas
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            level = root.replace(diretorio_raiz, '').count(os.sep)
            indent = ' ' * 4 * level
            f.write(f'{indent}{os.path.basename(root)}/\n')
            
            sub_indent = ' ' * 4 * (level + 1)
            for file in files:
                if file in IGNORE_FILES:
                    continue
                
                caminho_completo = os.path.join(root, file)
                f.write(f'{sub_indent}--- ARQUIVO: {file} ---\n')
                
                try:
                    with open(caminho_completo, 'r', encoding='utf-8') as conteudo:
                        f.write(conteudo.read())
                except Exception as e:
                    f.write(f'[Erro ao ler arquivo: {e}]\n')
                
                f.write(f'\n{sub_indent}--- FIM DO ARQUIVO ---\n\n')

if __name__ == "__main__":
    gerar_contexto('.', 'out.txt')
    print("Arquivo out.txt gerado com sucesso!")