#!/bin/bash
# Загружаем переменные из .env (исключая комментарии)
export $(grep -v '^#' .env | xargs)

# Замени 'idprod23' на свой реальный логин Docker Hub, если он другой!
DOCKER_IMAGE="idprod23/idpbank:latest"

echo "====================================="
echo "Начинаем локальную сборку Docker-образа"
echo "с внедрением переменных для Next.js..."
echo "====================================="

docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
  --build-arg NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT \
  --build-arg NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NEXT_PUBLIC_APPWRITE_PROJECT_ID \
  --build-arg NEXT_APPWRITE_KEY=$NEXT_APPWRITE_KEY \
  --build-arg APPWRITE_DATABASE_ID=$APPWRITE_DATABASE_ID \
  --build-arg APPWRITE_USER_COLLECTION_ID=$APPWRITE_USER_COLLECTION_ID \
  --build-arg APPWRITE_BANK_COLLECTION_ID=$APPWRITE_BANK_COLLECTION_ID \
  --build-arg APPWRITE_TRANSACTION_COLLECTION_ID=$APPWRITE_TRANSACTION_COLLECTION_ID \
  --build-arg PLAID_CLIENT_ID=$PLAID_CLIENT_ID \
  --build-arg PLAID_SECRET=$PLAID_SECRET \
  --build-arg DWOLLA_KEY=$DWOLLA_KEY \
  --build-arg DWOLLA_SECRET=$DWOLLA_SECRET \
  --build-arg DWOLLA_BASE_URL=$DWOLLA_BASE_URL \
  -t $DOCKER_IMAGE .

echo ""
echo "Сборка завершена!"
echo "Теперь отправляем образ в Docker Hub:"
echo "docker push $DOCKER_IMAGE"
echo "====================================="

docker push $DOCKER_IMAGE
