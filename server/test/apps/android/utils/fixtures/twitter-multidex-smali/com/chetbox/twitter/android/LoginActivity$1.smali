.class Lcom/chetbox/twitter/android/LoginActivity$1;
.super Lcom/twitter/sdk/android/core/Callback;
.source "LoginActivity.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/chetbox/twitter/android/LoginActivity;->onCreate(Landroid/os/Bundle;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation

.annotation system Ldalvik/annotation/Signature;
    value = {
        "Lcom/twitter/sdk/android/core/Callback",
        "<",
        "Lcom/twitter/sdk/android/core/TwitterSession;",
        ">;"
    }
.end annotation


# instance fields
.field final synthetic this$0:Lcom/chetbox/twitter/android/LoginActivity;


# direct methods
.method constructor <init>(Lcom/chetbox/twitter/android/LoginActivity;)V
    .registers 2

    .prologue
    .line 25
    iput-object p1, p0, Lcom/chetbox/twitter/android/LoginActivity$1;->this$0:Lcom/chetbox/twitter/android/LoginActivity;

    invoke-direct {p0}, Lcom/twitter/sdk/android/core/Callback;-><init>()V

    return-void
.end method


# virtual methods
.method public failure(Lcom/twitter/sdk/android/core/TwitterException;)V
    .registers 5
    .param p1, "e"    # Lcom/twitter/sdk/android/core/TwitterException;

    .prologue
    .line 40
    iget-object v0, p0, Lcom/chetbox/twitter/android/LoginActivity$1;->this$0:Lcom/chetbox/twitter/android/LoginActivity;

    invoke-virtual {p1}, Lcom/twitter/sdk/android/core/TwitterException;->getMessage()Ljava/lang/String;

    move-result-object v1

    const/4 v2, 0x0

    invoke-static {v0, v1, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object v0

    invoke-virtual {v0}, Landroid/widget/Toast;->show()V

    .line 41
    invoke-virtual {p1}, Lcom/twitter/sdk/android/core/TwitterException;->printStackTrace()V

    .line 42
    return-void
.end method

.method public success(Lcom/twitter/sdk/android/core/Result;)V
    .registers 5
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Lcom/twitter/sdk/android/core/Result",
            "<",
            "Lcom/twitter/sdk/android/core/TwitterSession;",
            ">;)V"
        }
    .end annotation

    .prologue
    .line 32
    .local p1, "result":Lcom/twitter/sdk/android/core/Result;, "Lcom/twitter/sdk/android/core/Result<Lcom/twitter/sdk/android/core/TwitterSession;>;"
    new-instance v0, Landroid/content/Intent;

    iget-object v1, p0, Lcom/chetbox/twitter/android/LoginActivity$1;->this$0:Lcom/chetbox/twitter/android/LoginActivity;

    const-class v2, Lcom/chetbox/twitter/android/TweetListActivity;

    invoke-direct {v0, v1, v2}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    .line 33
    .local v0, "tweetListIntent":Landroid/content/Intent;
    iget-object v1, p0, Lcom/chetbox/twitter/android/LoginActivity$1;->this$0:Lcom/chetbox/twitter/android/LoginActivity;

    invoke-virtual {v1, v0}, Lcom/chetbox/twitter/android/LoginActivity;->startActivity(Landroid/content/Intent;)V

    .line 35
    iget-object v1, p0, Lcom/chetbox/twitter/android/LoginActivity$1;->this$0:Lcom/chetbox/twitter/android/LoginActivity;

    invoke-virtual {v1}, Lcom/chetbox/twitter/android/LoginActivity;->finish()V

    .line 36
    return-void
.end method
