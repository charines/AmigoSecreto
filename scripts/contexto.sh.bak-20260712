#!/bin/bash

# Nome do arquivo de saída
OUTPUT="contexto_projeto.txt"

# Pastas e arquivos para ignorar (Regex)
IGNORE_PATTERN="node_modules|dist|\.git|build|\.next|package-lock.json|yarn.lock|\.png|\.jpg|\.ico"

echo "Gerando contexto do projeto em $OUTPUT..."

# 1. Cabeçalho
echo "=========================================" > $OUTPUT
echo "ESTRUTURA DO PROJETO" >> $OUTPUT
echo "Gerado em: $(date)" >> $OUTPUT
echo "=========================================" >> $OUTPUT

# 2. Árvore de diretórios (Ignorando o que não importa)
if command -v tree &> /dev/null; then
    tree -I "$IGNORE_PATTERN" >> $OUTPUT
else
    # Fallback caso não tenha o comando 'tree' instalado
    find . -maxdepth 3 -not -path '*/.*' >> $OUTPUT
fi

echo -e "\n\n=========================================" >> $OUTPUT
echo "CONTEÚDO DOS ARQUIVOS" >> $OUTPUT
echo "=========================================" >> $OUTPUT

# 3. Loop para ler arquivos de texto relevantes
# Adicione ou remova extensões conforme sua necessidade (.js, .py, .md, .html, etc)
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.md" -o -name "*.json" -o -name "*.css" -o -name "*.html" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "./$OUTPUT" | while read -r file; do

    echo -e "\n--- ARQUIVO: $file ---" >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo -e "\n--- FIM DE $file ---" >> $OUTPUT
done

echo "Concluído! Agora você pode me enviar o arquivo $OUTPUT."