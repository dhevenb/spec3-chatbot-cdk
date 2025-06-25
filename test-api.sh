#!/bin/bash

# Spec3 Chatbot API Test Script

# Default API Gateway URL (update this after deployment)
API_URL="https://your-api-gateway-url"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Spec3 Chatbot API Test Script${NC}"
echo ""

# Check if API URL is set
if [ "$API_URL" = "https://your-api-gateway-url" ]; then
    echo -e "${RED}❌ Please update the API_URL variable in this script with your actual API Gateway URL${NC}"
    echo "You can find this URL in the CDK deployment outputs or AWS Console"
    exit 1
fi

echo -e "${GREEN}✅ Testing API endpoints at: $API_URL${NC}"
echo ""

# Test health endpoint
echo -e "${YELLOW}🔍 Testing Health Endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi
echo ""

# Test knowledge base listing
echo -e "${YELLOW}📚 Testing Knowledge Base List...${NC}"
KB_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/knowledge-base" \
  -H "Content-Type: application/json" \
  -d '{"operation": "list_knowledge_bases"}')
HTTP_CODE=$(echo "$KB_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$KB_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Knowledge base list successful${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Knowledge base list failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi
echo ""

# Test chat endpoint
echo -e "${YELLOW}💬 Testing Chat Endpoint...${NC}"
CHAT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "session_id": "test-session-123"
  }')
HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CHAT_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Chat endpoint successful${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Chat endpoint failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi
echo ""

echo -e "${GREEN}🎉 API testing completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Notes:${NC}"
echo "- If you see errors related to knowledge base, you may need to create one first"
echo "- Update the KNOWLEDGE_BASE_ID environment variable in your Lambda function"
echo "- Check CloudWatch logs for detailed error information" 